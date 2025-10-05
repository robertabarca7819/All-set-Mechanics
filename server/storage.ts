import { type User, type InsertUser, type Job, type InsertJob, type Conversation, type InsertConversation, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByJobId(jobId: string): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  getLastMessageByConversationId(conversationId: string): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private lastMessageByConversationId: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.lastMessageByConversationId = new Map();
    this.seedData();
  }

  private seedData() {
    const job1: Job = {
      id: "job-1",
      serviceType: "Brake Service",
      title: "Front brake pads replacement",
      description: "Squeaking noise when braking. Need front brake pads replaced on 2018 Honda Civic.",
      location: "San Francisco, CA 94105",
      preferredDate: "2025-10-15",
      preferredTime: "14:00",
      estimatedPrice: 250,
      status: "accepted",
      customerId: "customer-1",
      providerId: "demo-user-1",
      createdAt: new Date("2025-10-05T10:00:00Z"),
    };
    this.jobs.set(job1.id, job1);

    const conv1: Conversation = {
      id: "conv-1",
      jobId: job1.id,
      customerId: "customer-1",
      providerId: "demo-user-1",
      createdAt: new Date("2025-10-05T10:30:00Z"),
    };
    this.conversations.set(conv1.id, conv1);

    const msg1: Message = {
      id: "msg-1",
      conversationId: conv1.id,
      senderId: "customer-1",
      content: "Hi! I noticed my brakes have been making a squeaking sound. Can you help?",
      createdAt: new Date("2025-10-05T10:35:00Z"),
    };
    this.messages.set(msg1.id, msg1);

    const msg2: Message = {
      id: "msg-2",
      conversationId: conv1.id,
      senderId: "demo-user-1",
      content: "Absolutely! I'd be happy to help. Based on your description, it sounds like your brake pads might need replacement. I can take a look at your 2018 Honda Civic.",
      createdAt: new Date("2025-10-05T10:40:00Z"),
    };
    this.messages.set(msg2.id, msg2);

    const msg3: Message = {
      id: "msg-3",
      conversationId: conv1.id,
      senderId: "customer-1",
      content: "That would be great! What's the estimated cost?",
      createdAt: new Date("2025-10-05T10:45:00Z"),
    };
    this.messages.set(msg3.id, msg3);

    const msg4: Message = {
      id: "msg-4",
      conversationId: conv1.id,
      senderId: "demo-user-1",
      content: "For a complete front brake pad replacement on a 2018 Honda Civic, I estimate around $250 including parts and labor. I can come to your location on October 15th at 2 PM if that works for you.",
      createdAt: new Date("2025-10-05T11:00:00Z"),
    };
    this.messages.set(msg4.id, msg4);
    
    this.lastMessageByConversationId.set(conv1.id, msg4);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = { 
      ...insertJob,
      status: insertJob.status || "requested",
      estimatedPrice: insertJob.estimatedPrice || null,
      providerId: insertJob.providerId || null,
      id,
      createdAt: new Date()
    };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationByJobId(jobId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conv) => conv.jobId === jobId
    );
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conv) => conv.customerId === userId || conv.providerId === userId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    this.lastMessageByConversationId.set(message.conversationId, message);
    return message;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getLastMessageByConversationId(conversationId: string): Promise<Message | undefined> {
    return this.lastMessageByConversationId.get(conversationId);
  }
}

export const storage = new MemStorage();
