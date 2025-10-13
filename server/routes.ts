import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertJobSchema } from "@shared/schema";

const wsClients = new Map<string, WebSocket>();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

export async function registerRoutes(app: Express): Promise<Server> {
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
        status: z.enum(["requested", "accepted", "payment_pending", "confirmed", "completed"]).optional(),
        providerId: z.string().optional(),
        estimatedPrice: z.number().optional(),
        contractTerms: z.string().optional(),
        customerSignature: z.string().optional(),
        providerSignature: z.string().optional(),
        signedAt: z.date().optional(),
        paymentStatus: z.string().optional(),
        checkoutSessionId: z.string().optional(),
        paymentLinkToken: z.string().optional(),
      });
      const updates = updateSchema.parse(req.body);
      const updatedJob = await storage.updateJob(id, updates);
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

      const subtotal = job.estimatedPrice;
      const tax = Math.round(subtotal * 0.09);
      const total = subtotal + tax;

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

      const session = await stripe.checkout.sessions.create({
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Checkout session creation error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.get("/api/pay/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const job = await storage.getJobByPaymentLinkToken(token);
      
      if (!job || !job.checkoutSessionId) {
        return res.status(404).send("Payment link not found or expired");
      }

      const session = await stripe.checkout.sessions.retrieve(job.checkoutSessionId);
      
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

    try {
      event = stripe.webhooks.constructEvent(
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

      if (jobId) {
        await storage.updateJob(jobId, {
          paymentStatus: "paid",
          checkoutSessionId: session.id,
        });
      }
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get("userId");
    
    if (userId) {
      wsClients.set(userId, ws);
      console.log(`WebSocket client connected: ${userId}`);
    }

    ws.on("close", () => {
      if (userId) {
        wsClients.delete(userId);
        console.log(`WebSocket client disconnected: ${userId}`);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
