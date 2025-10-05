import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";

const wsClients = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
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
