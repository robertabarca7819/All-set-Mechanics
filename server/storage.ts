import { type User, type InsertUser, type Job, type InsertJob, type Conversation, type InsertConversation, type Message, type InsertMessage, type AdminSession, type InsertAdminSession, type ProviderSession, type InsertProviderSession, type CustomerVerificationCode, type InsertCustomerVerificationCode, users, jobs, conversations, messages, adminSessions, providerSessions, customerVerificationCodes } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, or, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getJobByPaymentLinkToken(token: string): Promise<Job | undefined>;
  getJobByCustomerAccessToken(token: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByCustomerEmail(email: string): Promise<Job[]>;
  getJobsFiltered(filters: {
    status?: string;
    serviceType?: string;
    dateRange?: { start: string; end: string };
    isUrgent?: boolean;
  }): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByJobId(jobId: string): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  getLastMessageByConversationId(conversationId: string): Promise<Message | undefined>;
  
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSessionByToken(token: string): Promise<AdminSession | undefined>;
  deleteAdminSession(token: string): Promise<void>;
  
  createProviderSession(session: InsertProviderSession): Promise<ProviderSession>;
  getProviderSessionByToken(token: string): Promise<ProviderSession | undefined>;
  deleteProviderSession(id: string): Promise<void>;
  
  createVerificationCode(code: InsertCustomerVerificationCode): Promise<CustomerVerificationCode>;
  getVerificationCodeByEmail(email: string): Promise<CustomerVerificationCode | undefined>;
  deleteVerificationCode(id: string): Promise<void>;
  
  checkInMechanic(jobId: string): Promise<Job | undefined>;
  checkOutMechanic(jobId: string, jobNotes?: string): Promise<Job | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private lastMessageByConversationId: Map<string, Message>;
  private adminSessions: Map<string, AdminSession>;
  private providerSessions: Map<string, ProviderSession>;
  private verificationCodes: Map<string, CustomerVerificationCode>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.lastMessageByConversationId = new Map();
    this.adminSessions = new Map();
    this.providerSessions = new Map();
    this.verificationCodes = new Map();
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
      contractTerms: null,
      customerSignature: null,
      providerSignature: null,
      signedAt: null,
      paymentStatus: "pending",
      checkoutSessionId: null,
      paymentLinkToken: null,
      isUrgent: "false",
      responseDeadline: null,
      customerEmail: "customer1@example.com",
      customerAccessToken: null,
      depositAmount: 100,
      depositStatus: "pending",
      depositCheckoutSessionId: null,
      depositPaidAt: null,
      appointmentDateTime: new Date("2025-10-15T14:00:00Z"),
      previousAppointmentDateTime: null,
      rescheduleCount: 0,
      rescheduledAt: null,
      cancellationFee: 0,
      cancellationFeeStatus: "none",
      cancelledAt: null,
      mechanicCheckedInAt: null,
      mechanicCheckedOutAt: null,
      actualStartTime: null,
      actualEndTime: null,
      jobNotes: null,
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

    const job2: Job = {
      id: "job-2",
      serviceType: "Oil Change",
      title: "Synthetic oil change",
      description: "Regular maintenance oil change for 2020 Toyota Camry, synthetic oil preferred.",
      location: "Oakland, CA 94612",
      preferredDate: "2025-10-16",
      preferredTime: "10:00",
      estimatedPrice: 80,
      status: "requested",
      customerId: "customer-2",
      providerId: null,
      createdAt: new Date("2025-10-05T09:00:00Z"),
      contractTerms: null,
      customerSignature: null,
      providerSignature: null,
      signedAt: null,
      paymentStatus: "pending",
      checkoutSessionId: null,
      paymentLinkToken: null,
      isUrgent: "true",
      responseDeadline: new Date("2025-10-05T12:00:00Z"),
      customerEmail: "customer2@example.com",
      customerAccessToken: null,
      depositAmount: 100,
      depositStatus: "pending",
      depositCheckoutSessionId: null,
      depositPaidAt: null,
      appointmentDateTime: new Date("2025-10-16T10:00:00Z"),
      previousAppointmentDateTime: null,
      rescheduleCount: 0,
      rescheduledAt: null,
      cancellationFee: 0,
      cancellationFeeStatus: "none",
      cancelledAt: null,
      mechanicCheckedInAt: null,
      mechanicCheckedOutAt: null,
      actualStartTime: null,
      actualEndTime: null,
      jobNotes: null,
    };
    this.jobs.set(job2.id, job2);

    const job3: Job = {
      id: "job-3",
      serviceType: "Engine Repair",
      title: "Check engine light diagnostics",
      description: "Check engine light came on. Need diagnostic scan and repair estimate.",
      location: "Berkeley, CA 94704",
      preferredDate: "2025-10-17",
      preferredTime: "09:00",
      estimatedPrice: 120,
      status: "requested",
      customerId: "customer-3",
      providerId: null,
      createdAt: new Date("2025-10-05T08:00:00Z"),
      contractTerms: null,
      customerSignature: null,
      providerSignature: null,
      signedAt: null,
      paymentStatus: "pending",
      checkoutSessionId: null,
      paymentLinkToken: null,
      isUrgent: "false",
      responseDeadline: null,
      customerEmail: "customer3@example.com",
      customerAccessToken: null,
      depositAmount: 100,
      depositStatus: "pending",
      depositCheckoutSessionId: null,
      depositPaidAt: null,
      appointmentDateTime: new Date("2025-10-17T09:00:00Z"),
      previousAppointmentDateTime: null,
      rescheduleCount: 0,
      rescheduledAt: null,
      cancellationFee: 0,
      cancellationFeeStatus: "none",
      cancelledAt: null,
      mechanicCheckedInAt: null,
      mechanicCheckedOutAt: null,
      actualStartTime: null,
      actualEndTime: null,
      jobNotes: null,
    };
    this.jobs.set(job3.id, job3);
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
    const user: User = { 
      ...insertUser,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      phoneNumber: insertUser.phoneNumber ?? null,
      employeeId: insertUser.employeeId ?? null,
      id,
      role: insertUser.role || "provider",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = { 
      ...insertJob,
      status: insertJob.status || "requested",
      estimatedPrice: insertJob.estimatedPrice || null,
      customerId: insertJob.customerId || null,
      providerId: insertJob.providerId || null,
      contractTerms: null,
      customerSignature: null,
      providerSignature: null,
      signedAt: null,
      paymentStatus: insertJob.paymentStatus || "pending",
      checkoutSessionId: null,
      paymentLinkToken: null,
      isUrgent: insertJob.isUrgent || "false",
      responseDeadline: insertJob.responseDeadline || null,
      customerEmail: insertJob.customerEmail || '',
      customerAccessToken: insertJob.customerAccessToken || null,
      depositAmount: insertJob.depositAmount || 100,
      depositStatus: insertJob.depositStatus || "pending",
      depositCheckoutSessionId: null,
      depositPaidAt: null,
      appointmentDateTime: insertJob.appointmentDateTime || null,
      previousAppointmentDateTime: null,
      rescheduleCount: 0,
      rescheduledAt: null,
      cancellationFee: 0,
      cancellationFeeStatus: "none",
      cancelledAt: null,
      mechanicCheckedInAt: null,
      mechanicCheckedOutAt: null,
      actualStartTime: null,
      actualEndTime: null,
      jobNotes: null,
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

  async getJobByPaymentLinkToken(token: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(
      (job) => job.paymentLinkToken === token
    );
  }

  async getJobByCustomerAccessToken(token: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(
      (job) => job.customerAccessToken === token
    );
  }

  async getJobsByCustomerEmail(email: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.customerEmail === email
    );
  }

  async getJobsFiltered(filters: {
    status?: string;
    serviceType?: string;
    dateRange?: { start: string; end: string };
    isUrgent?: boolean;
  }): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());

    if (filters.status) {
      jobs = jobs.filter((job) => job.status === filters.status);
    }

    if (filters.serviceType) {
      jobs = jobs.filter((job) => job.serviceType === filters.serviceType);
    }

    if (filters.isUrgent !== undefined) {
      const isUrgentStr = filters.isUrgent ? "true" : "false";
      jobs = jobs.filter((job) => job.isUrgent === isUrgentStr);
    }

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      jobs = jobs.filter((job) => {
        if (!job.appointmentDateTime) return false;
        const appointmentDate = new Date(job.appointmentDateTime);
        return appointmentDate >= startDate && appointmentDate <= endDate;
      });
    }

    return jobs;
  }

  async createAdminSession(insertSession: InsertAdminSession): Promise<AdminSession> {
    const id = randomUUID();
    const session: AdminSession = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    this.adminSessions.set(session.token, session);
    return session;
  }

  async getAdminSessionByToken(token: string): Promise<AdminSession | undefined> {
    const session = this.adminSessions.get(token);
    if (!session) return undefined;
    
    if (session.expiresAt < new Date()) {
      this.adminSessions.delete(token);
      return undefined;
    }
    
    return session;
  }

  async deleteAdminSession(token: string): Promise<void> {
    this.adminSessions.delete(token);
  }

  async createProviderSession(insertSession: InsertProviderSession): Promise<ProviderSession> {
    const id = randomUUID();
    const session: ProviderSession = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    this.providerSessions.set(session.token, session);
    return session;
  }

  async getProviderSessionByToken(token: string): Promise<ProviderSession | undefined> {
    const session = this.providerSessions.get(token);
    if (!session) return undefined;
    
    if (session.expiresAt < new Date()) {
      this.providerSessions.delete(token);
      return undefined;
    }
    
    return session;
  }

  async deleteProviderSession(id: string): Promise<void> {
    const session = Array.from(this.providerSessions.values()).find(s => s.id === id);
    if (session) {
      this.providerSessions.delete(session.token);
    }
  }

  async createVerificationCode(insertCode: InsertCustomerVerificationCode): Promise<CustomerVerificationCode> {
    const id = randomUUID();
    const code: CustomerVerificationCode = {
      ...insertCode,
      id,
      createdAt: new Date()
    };
    this.verificationCodes.set(id, code);
    return code;
  }

  async getVerificationCodeByEmail(email: string): Promise<CustomerVerificationCode | undefined> {
    const codes = Array.from(this.verificationCodes.values())
      .filter(code => code.email === email)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (codes.length === 0) return undefined;
    
    const latestCode = codes[0];
    
    if (new Date() > new Date(latestCode.expiresAt)) {
      this.verificationCodes.delete(latestCode.id);
      return undefined;
    }
    
    return latestCode;
  }

  async deleteVerificationCode(id: string): Promise<void> {
    this.verificationCodes.delete(id);
  }

  async checkInMechanic(jobId: string): Promise<Job | undefined> {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    const now = new Date();
    const updatedJob = {
      ...job,
      mechanicCheckedInAt: now,
      actualStartTime: now,
    };
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }

  async checkOutMechanic(jobId: string, jobNotes?: string): Promise<Job | undefined> {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    const now = new Date();
    const updatedJob = {
      ...job,
      mechanicCheckedOutAt: now,
      actualEndTime: now,
      jobNotes: jobNotes || job.jobNotes,
    };
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(job).returning();
    return result[0];
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async getJobByPaymentLinkToken(token: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.paymentLinkToken, token)).limit(1);
    return result[0];
  }

  async getJobByCustomerAccessToken(token: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.customerAccessToken, token)).limit(1);
    return result[0];
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJobsByCustomerEmail(email: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.customerEmail, email));
  }

  async getJobsFiltered(filters: {
    status?: string;
    serviceType?: string;
    dateRange?: { start: string; end: string };
    isUrgent?: boolean;
  }): Promise<Job[]> {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(jobs.status, filters.status));
    }

    if (filters.serviceType) {
      conditions.push(eq(jobs.serviceType, filters.serviceType));
    }

    if (filters.isUrgent !== undefined) {
      const isUrgentStr = filters.isUrgent ? "true" : "false";
      conditions.push(eq(jobs.isUrgent, isUrgentStr));
    }

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      conditions.push(
        and(
          gte(jobs.appointmentDateTime, startDate),
          lte(jobs.appointmentDateTime, endDate)
        )
      );
    }

    if (conditions.length > 0) {
      return await db.select().from(jobs).where(and(...conditions));
    }

    return await db.select().from(jobs);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const result = await db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return result[0];
  }

  async getConversationByJobId(jobId: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.jobId, jobId)).limit(1);
    return result[0];
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db.select().from(conversations).where(
      or(
        eq(conversations.customerId, userId),
        eq(conversations.providerId, userId)
      )
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async getLastMessageByConversationId(conversationId: string): Promise<Message | undefined> {
    const result = await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    return result[0];
  }

  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const result = await db.insert(adminSessions).values(session).returning();
    return result[0];
  }

  async getAdminSessionByToken(token: string): Promise<AdminSession | undefined> {
    const result = await db.select().from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, token),
          gte(adminSessions.expiresAt, new Date())
        )
      )
      .limit(1);
    return result[0];
  }

  async deleteAdminSession(token: string): Promise<void> {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }

  async createProviderSession(session: InsertProviderSession): Promise<ProviderSession> {
    const result = await db.insert(providerSessions).values(session).returning();
    return result[0];
  }

  async getProviderSessionByToken(token: string): Promise<ProviderSession | undefined> {
    const result = await db.select().from(providerSessions)
      .where(
        and(
          eq(providerSessions.token, token),
          gte(providerSessions.expiresAt, new Date())
        )
      )
      .limit(1);
    return result[0];
  }

  async deleteProviderSession(id: string): Promise<void> {
    await db.delete(providerSessions).where(eq(providerSessions.id, id));
  }

  async createVerificationCode(code: InsertCustomerVerificationCode): Promise<CustomerVerificationCode> {
    const result = await db.insert(customerVerificationCodes).values(code).returning();
    return result[0];
  }

  async getVerificationCodeByEmail(email: string): Promise<CustomerVerificationCode | undefined> {
    const result = await db.select().from(customerVerificationCodes)
      .where(
        and(
          eq(customerVerificationCodes.email, email),
          gte(customerVerificationCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(customerVerificationCodes.createdAt))
      .limit(1);
    return result[0];
  }

  async deleteVerificationCode(id: string): Promise<void> {
    await db.delete(customerVerificationCodes).where(eq(customerVerificationCodes.id, id));
  }

  async checkInMechanic(jobId: string): Promise<Job | undefined> {
    const now = new Date();
    const result = await db.update(jobs)
      .set({ 
        mechanicCheckedInAt: now,
        actualStartTime: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();
    return result[0];
  }

  async checkOutMechanic(jobId: string, jobNotes?: string): Promise<Job | undefined> {
    const now = new Date();
    const updates: any = {
      mechanicCheckedOutAt: now,
      actualEndTime: now,
    };
    if (jobNotes) {
      updates.jobNotes = jobNotes;
    }
    const result = await db.update(jobs)
      .set(updates)
      .where(eq(jobs.id, jobId))
      .returning();
    return result[0];
  }
}

// Use DatabaseStorage instead of MemStorage for PostgreSQL
export const storage = new DatabaseStorage();
