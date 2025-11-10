import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { createHash } from "crypto";

const hasReplitAuthConfig = Boolean(
  process.env.REPLIT_DOMAINS &&
  process.env.REPL_ID &&
  process.env.SESSION_SECRET,
);
const isProduction = process.env.NODE_ENV === "production";

if (!hasReplitAuthConfig) {
  const message =
    "Replit Auth environment variables are not fully configured. Set REPLIT_DOMAINS, REPL_ID, and SESSION_SECRET.";
  if (isProduction) {
    throw new Error(message);
  }

  console.warn(
    `${message} Authenticated routes will be disabled while running in development.`,
  );
}

const sessionSecret = process.env.SESSION_SECRET ?? "insecure-development-secret";

if (!process.env.SESSION_SECRET) {
  console.warn(
    "SESSION_SECRET is not set. Falling back to an insecure development secret. Configure SESSION_SECRET for production use.",
  );
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  if (!process.env.DATABASE_URL) {
    return session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: sessionTtl,
      },
    });
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Convert Replit's sub claim to a deterministic UUID for our existing users table
function subToUuid(sub: string): string {
  // Create a deterministic UUID from the Replit sub claim
  // We use SHA-256 to hash the sub and format it as a UUID
  const hash = createHash('sha256').update(`replit-${sub}`).digest('hex');
  // Format as UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20), // Variant
    hash.substring(20, 32)
  ].join('-');
}

async function upsertUser(claims: any) {
  const userId = subToUuid(claims["sub"]);
  await storage.upsertUser({
    id: userId,
    username: claims["email"] || `replit_user_${claims["sub"]}`, // Use email as username or fallback
    password: `replit_oauth_${claims["sub"]}`, // Placeholder password for OAuth users
    role: "customer", // Replit Auth users are always customers
    firstName: claims["first_name"] || null,
    lastName: claims["last_name"] || null,
    phoneNumber: null,
    employeeId: null,
    profileImageUrl: claims["profile_image_url"] || null,
  });
}

export async function setupAuth(app: Express) {
  if (!hasReplitAuthConfig) {
    if (isProduction) {
      throw new Error(
        "Replit Auth is required in production. Ensure REPLIT_DOMAINS, REPL_ID, and SESSION_SECRET are configured.",
      );
    }

    return;
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/quick-access",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!hasReplitAuthConfig) {
    if (isProduction) {
      return res.status(500).json({
        message:
          "Replit Auth is misconfigured in production. Set REPLIT_DOMAINS, REPL_ID, and SESSION_SECRET to protect this route.",
      });
    }

    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Helper function to get the UUID from the Replit sub claim
export function getUserIdFromClaims(claims: any): string {
  return subToUuid(claims["sub"]);
}