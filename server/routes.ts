import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertJobSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, getUserIdFromClaims } from "./replitAuth";

const wsClients = new Map<string, WebSocket>();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";
let stripe: Stripe | null = null;

if (!stripeSecretKey) {
  console.warn(
    "STRIPE_SECRET_KEY is not set. Stripe-powered features will be disabled until it is configured.",
  );
} else {
  if (!isProduction && !stripeSecretKey.startsWith("sk_test_")) {
    console.warn(
      "STRIPE_SECRET_KEY does not start with 'sk_test_'. Make sure you are using a test key in development.",
    );
  }

  try {
    stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
  } catch (error) {
    console.error("Failed to initialize Stripe client:", error);
  }
}

function getStripeClient(res: Response): Stripe | null {
  if (!stripe) {
    res.status(500).json({
      error:
        "Stripe is not properly configured. Please set STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY in Secrets.",
    });
    return null;
  }

  return stripe;
}

async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = await storage.getAdminSessionByToken(token);

  if (!session) {
    res.clearCookie("adminToken");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if session has expired
  if (new Date() > new Date(session.expiresAt)) {
    await storage.deleteAdminSession(session.id);
    res.clearCookie("adminToken");
    return res.status(401).json({ error: "Session expired" });
  }

  next();
}

async function providerAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.providerToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = await storage.getProviderSessionByToken(token);

  if (!session) {
    res.clearCookie("providerToken");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if session has expired
  if (new Date() > new Date(session.expiresAt)) {
    await storage.deleteProviderSession(session.id);
    res.clearCookie("providerToken");
    return res.status(401).json({ error: "Session expired" });
  }

  (req as any).providerId = session.providerId;
  next();
}

async function customerAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.customerToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = await storage.getCustomerSessionByToken(token);

  if (!session) {
    res.clearCookie("customerToken");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if session has expired
  if (new Date() > new Date(session.expiresAt)) {
    await storage.deleteCustomerSession(session.id);
    res.clearCookie("customerToken");
    return res.status(401).json({ error: "Session expired" });
  }

  (req as any).customerId = session.customerId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (OpenID Connect) for customer quick access
  await setupAuth(app);

  // Admin authentication endpoints
  app.post("/api/admin/login", async (req, res) => {
    try {
      const schema = z.object({
        password: z.string(),
      });
      const { password } = schema.parse(req.body);

      if (!process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ error: "Admin password not configured" });
      }

      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createAdminSession({
        token,
        expiresAt,
      });

      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      const token = req.cookies?.adminToken;
      if (token) {
        const session = await storage.getAdminSessionByToken(token);
        if (session) {
          await storage.deleteAdminSession(session.id);
        }
      }
      res.clearCookie("adminToken");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/admin/verify", async (req, res) => {
    try {
      const token = req.cookies?.adminToken;

      if (!token) {
        return res.json({ authenticated: false });
      }

      const session = await storage.getAdminSessionByToken(token);

      if (!session) {
        res.clearCookie("adminToken");
        return res.json({ authenticated: false });
      }

      // Check if session has expired
      if (new Date() > new Date(session.expiresAt)) {
        await storage.deleteAdminSession(session.id);
        res.clearCookie("adminToken");
        return res.json({ authenticated: false });
      }

      res.json({ authenticated: true });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Provider authentication endpoints
  app.post("/api/provider/register", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().min(1),
      });
      const { username, password, firstName, lastName, phoneNumber } = schema.parse(req.body);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const timestamp = Date.now();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const employeeId = `EMP-${timestamp}-${randomNum}`;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: "provider",
        firstName,
        lastName,
        phoneNumber,
        employeeId,
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await storage.createProviderSession({
        providerId: user.id,
        token,
        expiresAt,
      });

      res.cookie("providerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role },
        employeeId: user.employeeId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/provider/login", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });
      const { username, password } = schema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user || user.role !== "provider") {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      let isPasswordValid = false;

      if (user.password?.startsWith("$2b$")) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else if (user.password === password) {
        isPasswordValid = true;

        const upgradedPassword = await bcrypt.hash(password, 10);
        await storage.updateUserPassword(user.id, upgradedPassword);
      }

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await storage.createProviderSession({
        providerId: user.id,
        token,
        expiresAt,
      });

      res.cookie("providerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ 
        success: true,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/provider/logout", async (req, res) => {
    try {
      const token = req.cookies?.providerToken;
      if (token) {
        const session = await storage.getProviderSessionByToken(token);
        if (session) {
          await storage.deleteProviderSession(session.id);
        }
      }
      res.clearCookie("providerToken");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/provider/verify", async (req, res) => {
    try {
      const token = req.cookies?.providerToken;

      if (!token) {
        return res.json({ authenticated: false });
      }

      const session = await storage.getProviderSessionByToken(token);

      if (!session) {
        res.clearCookie("providerToken");
        return res.json({ authenticated: false });
      }

      if (new Date() > new Date(session.expiresAt)) {
        await storage.deleteProviderSession(session.id);
        res.clearCookie("providerToken");
        return res.json({ authenticated: false });
      }

      const user = await storage.getUser(session.providerId);

      res.json({ 
        authenticated: true,
        user: user ? { id: user.id, username: user.username, role: user.role } : null
      });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Customer registration endpoint
  app.post("/api/customer/register", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phoneNumber: z.string().optional(),
      });
      const { username, password, firstName, lastName, phoneNumber } = schema.parse(req.body);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: "customer",
        firstName,
        lastName,
        phoneNumber,
      });

      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Customer login endpoint
  app.post("/api/customer/login", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });
      const { username, password } = schema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (user.role !== "customer") {
        return res.status(403).json({ error: "Not authorized as a customer" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await storage.createCustomerSession({
        customerId: user.id,
        token,
        expiresAt,
      });

      res.cookie("customerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ 
        success: true,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/customer/logout", async (req, res) => {
    try {
      const token = req.cookies?.customerToken;
      if (token) {
        const session = await storage.getCustomerSessionByToken(token);
        if (session) {
          await storage.deleteCustomerSession(session.id);
        }
      }
      res.clearCookie("customerToken");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/customer/verify", async (req, res) => {
    try {
      const token = req.cookies?.customerToken;

      if (!token) {
        return res.json({ authenticated: false });
      }

      const session = await storage.getCustomerSessionByToken(token);

      if (!session) {
        res.clearCookie("customerToken");
        return res.json({ authenticated: false });
      }

      if (new Date() > new Date(session.expiresAt)) {
        await storage.deleteCustomerSession(session.id);
        res.clearCookie("customerToken");
        return res.json({ authenticated: false });
      }

      const user = await storage.getUser(session.customerId);

      res.json({ 
        authenticated: true,
        user: user ? { id: user.id, username: user.username, role: user.role } : null
      });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const conversations = await storage.getConversationsByUserId(userId);

      const conversationsWithJobsAndMessages = await Promise.all(
        conversations.map(async (conv) => {
          const job = await storage.getJob(conv.jobId);
          const lastMessage = await storage.getLastMessageByConversationId(conv.id);
          return { ...conv, job, lastMessage: lastMessage?.content };
        })
      );

      res.json(conversationsWithJobsAndMessages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const conversation = await storage.getConversationByJobId(jobId);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ error: "Invalid conversation data" });
    }
  });

  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessagesByConversationId(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);

      const conversation = await storage.getConversation(message.conversationId);
      if (conversation) {
        const job = await storage.getJob(conversation.jobId);
        const wsPayload = {
          type: "new_message",
          message,
          conversationId: conversation.id,
          jobTitle: job?.title,
        };

        [conversation.customerId, conversation.providerId].forEach(userId => {
          const client = wsClients.get(userId);
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(wsPayload));
          }
        });
      }

      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid job data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        status: z.enum(["requested", "accepted", "deposit_due", "payment_pending", "confirmed", "completed"]).optional(),
        providerId: z.string().optional(),
        estimatedPrice: z.number().optional(),
        contractTerms: z.string().optional(),
        customerSignature: z.string().optional(),
        providerSignature: z.string().optional(),
        signedAt: z.date().optional(),
        paymentStatus: z.string().optional(),
        checkoutSessionId: z.string().optional(),
        paymentLinkToken: z.string().optional(),
        customerEmail: z.string().email().optional(),
        isUrgent: z.enum(["true", "false"]).optional(),
        responseDeadline: z.string().optional(),
        appointmentDateTime: z.string().optional(),
      });
      const parsedUpdates = updateSchema.parse(req.body);

      const updateData: any = { ...parsedUpdates };
      if (parsedUpdates.responseDeadline) {
        updateData.responseDeadline = new Date(parsedUpdates.responseDeadline);
      }
      if (parsedUpdates.appointmentDateTime) {
        updateData.appointmentDateTime = new Date(parsedUpdates.appointmentDateTime);
      }

      const updatedJob = await storage.updateJob(id, updateData);
      if (!updatedJob) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(updatedJob);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  // Replit Auth endpoints for customer quick access
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserIdFromClaims(req.user.claims);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/customer/jobs-by-email", isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      if (!userEmail) {
        return res.status(400).json({ error: "No email associated with this account" });
      }
      const jobs = await storage.getJobsByCustomerEmail(userEmail);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching customer jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.post("/api/jobs/:jobId/check-in", providerAuthMiddleware, async (req, res) => {
    try {
      const { jobId } = req.params;
      const providerId = (req as any).providerId;

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.providerId !== providerId) {
        return res.status(403).json({ error: "Not authorized for this job" });
      }

      if (job.mechanicCheckedInAt) {
        return res.status(400).json({ error: "Already checked in" });
      }

      const updatedJob = await storage.checkInMechanic(jobId);
      res.json({ 
        success: true, 
        message: "Checked in successfully",
        job: updatedJob 
      });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  app.post("/api/jobs/:jobId/check-out", providerAuthMiddleware, async (req, res) => {
    try {
      const { jobId } = req.params;
      const providerId = (req as any).providerId;
      const schema = z.object({
        jobNotes: z.string().optional(),
      });
      const { jobNotes } = schema.parse(req.body);

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.providerId !== providerId) {
        return res.status(403).json({ error: "Not authorized for this job" });
      }

      if (!job.mechanicCheckedInAt) {
        return res.status(400).json({ error: "Must check in before checking out" });
      }

      if (job.mechanicCheckedOutAt) {
        return res.status(400).json({ error: "Already checked out" });
      }

      const updatedJob = await storage.checkOutMechanic(jobId, jobNotes);
      res.json({ 
        success: true, 
        message: "Checked out successfully",
        job: updatedJob 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Check-out error:", error);
      res.status(500).json({ error: "Failed to check out" });
    }
  });

  app.post("/api/deposits/:jobId", adminAuthMiddleware, async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const depositAmount = job.depositAmount || 100;
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

      const stripeClient = getStripeClient(res);
      if (!stripeClient) {
        return;
      }

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Deposit - ${job.title}`,
                description: `$${depositAmount} deposit for ${job.serviceType}`,
              },
              unit_amount: depositAmount * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/admin`,
        cancel_url: `${baseUrl}/admin`,
        metadata: {
          jobId,
          type: "deposit",
        },
      });

      const depositLinkToken = randomBytes(32).toString("hex");
      await storage.updateJob(jobId, { 
        depositCheckoutSessionId: session.id,
        status: "deposit_due",
      });

      res.json({ 
        sessionId: session.id,
        depositLinkToken,
        checkoutUrl: session.url,
      });
    } catch (error) {
      console.error("Deposit checkout session creation error:", error);
      res.status(500).json({ error: "Failed to create deposit checkout session" });
    }
  });

  app.post("/api/checkout-sessions", adminAuthMiddleware, async (req, res) => {
    try {
      const schema = z.object({
        jobId: z.string(),
      });
      const { jobId } = schema.parse(req.body);

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (!job.estimatedPrice) {
        return res.status(400).json({ error: "Job does not have an estimated price" });
      }

      let subtotal = job.estimatedPrice;

      if (job.depositStatus === "paid" && job.depositAmount) {
        subtotal = subtotal - job.depositAmount;
      }

      const tax = Math.round(job.estimatedPrice * 0.09);
      const total = subtotal + tax;

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

      const stripeClient = getStripeClient(res);
      if (!stripeClient) {
        return;
      }

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: job.title,
                description: `${job.serviceType} - ${job.description.substring(0, 100)}`,
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/contract/${jobId}`,
        cancel_url: `${baseUrl}/admin`,
        metadata: {
          jobId,
          type: "final",
        },
      });

      const paymentLinkToken = randomBytes(32).toString("hex");
      await storage.updateJob(jobId, { 
        paymentLinkToken,
        checkoutSessionId: session.id,
      });

      res.json({ 
        sessionId: session.id,
        paymentLinkToken,
      });
    } catch (error) {
      console.error("Checkout session creation error:", error);
      if (error instanceof Error && error.message.includes('Invalid API Key')) {
        return res.status(500).json({ 
          error: "Stripe is not properly configured. Please set STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY in Secrets." 
        });
      }
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/customer/reschedule", async (req, res) => {
    try {
      const schema = z.object({
        jobId: z.string(),
        newDate: z.string(),
        newTime: z.string(),
        accessToken: z.string(),
      });
      const { jobId, newDate, newTime, accessToken } = schema.parse(req.body);

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.customerAccessToken !== accessToken) {
        return res.status(401).json({ error: "Invalid access token" });
      }

      if (!job.appointmentDateTime) {
        return res.status(400).json({ error: "No appointment scheduled" });
      }

      const now = new Date();
      const appointmentDate = new Date(job.appointmentDateTime);
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment >= 24) {
        const newAppointmentDateTime = new Date(`${newDate}T${newTime}:00Z`);
        await storage.updateJob(jobId, {
          previousAppointmentDateTime: job.appointmentDateTime,
          appointmentDateTime: newAppointmentDateTime,
          rescheduleCount: (job.rescheduleCount || 0) + 1,
          rescheduledAt: new Date(),
        });

        res.json({ 
          success: true, 
          message: "Appointment rescheduled successfully",
          newAppointmentDateTime: newAppointmentDateTime.toISOString(),
        });
      } else {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
          return;
        }

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Reschedule Fee - ${job.title}`,
                  description: "Late reschedule fee (less than 24 hours notice)",
                },
                unit_amount: 5000,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${baseUrl}/my-jobs`,
          cancel_url: `${baseUrl}/my-jobs`,
          metadata: {
            jobId,
            type: "reschedule_fee",
            newDate,
            newTime,
          },
        });

        res.json({ 
          requiresPayment: true,
          checkoutUrl: session.url,
          message: "Reschedule within 24 hours requires a $50 fee",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Reschedule error:", error);
      res.status(500).json({ error: "Failed to reschedule appointment" });
    }
  });

  app.post("/api/customer/request-access", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
      });
      const { email } = schema.parse(req.body);

      const jobs = await storage.getJobsByCustomerEmail(email);
      if (jobs.length === 0) {
        return res.status(404).json({ error: "No jobs found for this email" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await storage.createVerificationCode({
        email,
        code,
        expiresAt,
      });

      res.json({ 
        message: "Verification code sent",
        code,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Request access error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/customer/verify-access", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        code: z.string(),
      });
      const { email, code } = schema.parse(req.body);

      const verificationCode = await storage.getVerificationCodeByEmail(email);

      if (!verificationCode || verificationCode.code !== code) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }

      const accessToken = randomBytes(32).toString("hex");
      const jobs = await storage.getJobsByCustomerEmail(email);

      for (const job of jobs) {
        await storage.updateJob(job.id, { customerAccessToken: accessToken });
      }

      await storage.deleteVerificationCode(verificationCode.id);

      res.json({ 
        accessToken,
        message: "Access granted successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Verify access error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.get("/api/customer/jobs", async (req, res) => {
    try {
      const accessToken = req.query.token as string;

      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }

      const job = await storage.getJobByCustomerAccessToken(accessToken);

      if (!job) {
        return res.status(404).json({ error: "No jobs found for this access token" });
      }

      const jobs = await storage.getJobsByCustomerEmail(job.customerEmail!);

      res.json(jobs);
    } catch (error) {
      console.error("Get customer jobs error:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.post("/api/customer/cancel", async (req, res) => {
    try {
      const schema = z.object({
        jobId: z.string(),
        accessToken: z.string(),
      });
      const { jobId, accessToken } = schema.parse(req.body);

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.customerAccessToken !== accessToken) {
        return res.status(401).json({ error: "Invalid access token" });
      }

      if (!job.appointmentDateTime) {
        return res.status(400).json({ error: "No appointment scheduled" });
      }

      const now = new Date();
      const appointmentDate = new Date(job.appointmentDateTime);
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment >= 24) {
        await storage.updateJob(jobId, {
          status: "cancelled",
          cancelledAt: new Date(),
        });

        res.json({ 
          success: true, 
          message: "Appointment cancelled successfully",
        });
      } else {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
          return;
        }

        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Cancellation Fee - ${job.title}`,
                  description: "Late cancellation fee (less than 24 hours notice)",
                },
                unit_amount: 5000,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${baseUrl}/my-jobs`,
          cancel_url: `${baseUrl}/my-jobs`,
          metadata: {
            jobId,
            type: "cancellation_fee",
          },
        });

        res.json({ 
          requiresPayment: true,
          checkoutUrl: session.url,
          message: "Cancellation within 24 hours requires a $50 fee",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Cancellation error:", error);
      res.status(500).json({ error: "Failed to cancel appointment" });
    }
  });

  app.get("/api/pay/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const job = await storage.getJobByPaymentLinkToken(token);

      if (!job || !job.checkoutSessionId) {
        return res.status(404).send("Payment link not found or expired");
      }

      const stripeClient = getStripeClient(res);
      if (!stripeClient) {
        return;
      }

      const session = await stripeClient.checkout.sessions.retrieve(job.checkoutSessionId);

      if (session.url) {
        return res.redirect(303, session.url);
      }

      res.status(400).send("Invalid checkout session");
    } catch (error) {
      console.error("Payment link redirect error:", error);
      res.status(500).send("Failed to redirect to payment");
    }
  });

  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("Missing stripe-signature header");
    }

    let event;

    const stripeClient = getStripeClient(res);
    if (!stripeClient) {
      return;
    }

    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const jobId = session.metadata?.jobId;
      const paymentType = session.metadata?.type;

      if (jobId) {
        if (paymentType === "deposit") {
          await storage.updateJob(jobId, {
            depositStatus: "paid",
            depositPaidAt: new Date(),
            status: "confirmed",
          });
        } else if (paymentType === "reschedule_fee") {
          const newDate = session.metadata?.newDate;
          const newTime = session.metadata?.newTime;
          const job = await storage.getJob(jobId);

          if (job && newDate && newTime) {
            const newAppointmentDateTime = new Date(`${newDate}T${newTime}:00Z`);
            await storage.updateJob(jobId, {
              previousAppointmentDateTime: job.appointmentDateTime,
              appointmentDateTime: newAppointmentDateTime,
              rescheduleCount: (job.rescheduleCount || 0) + 1,
              rescheduledAt: new Date(),
              cancellationFee: 50,
              cancellationFeeStatus: "paid",
            });
          }
        } else if (paymentType === "cancellation_fee") {
          await storage.updateJob(jobId, {
            status: "cancelled",
            cancelledAt: new Date(),
            cancellationFee: 50,
            cancellationFeeStatus: "paid",
          });
        } else {
          await storage.updateJob(jobId, {
            paymentStatus: "paid",
            checkoutSessionId: session.id,
          });
        }
      }
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);

  // This part of the code connects to the WebSocket server.
  // It listens for incoming WebSocket connections on the '/ws' path.
  // When a client connects, it extracts the 'userId' from the URL parameters.
  // If 'userId' is present, it stores the WebSocket client in the 'wsClients' map,
  // associating it with the 'userId'. It also logs that a client has connected.
  // When a client disconnects, it removes the client from the 'wsClients' map and logs the disconnection.
  // If any WebSocket error occurs, it logs the error.
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    // Extract userId from the query parameters of the WebSocket request URL.
    // The URL is parsed to get search parameters.
    const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get("userId");

    if (userId) {
      // If userId is found, associate the WebSocket client with this userId in the wsClients map.
      wsClients.set(userId, ws);
      console.log(`WebSocket client connected: ${userId}`);
    }

    // Event handler for when the WebSocket connection is closed.
    ws.on("close", () => {
      if (userId) {
        // Remove the client from the map and log the disconnection.
        wsClients.delete(userId);
        console.log(`WebSocket client disconnected: ${userId}`);
      }
    });

    // Event handler for WebSocket errors.
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    console.error('Error:', err);
  });

  return httpServer;
}