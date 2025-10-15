import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("provider"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: text("service_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  estimatedPrice: integer("estimated_price"),
  status: text("status").notNull().default("requested"),
  customerId: varchar("customer_id"),
  providerId: varchar("provider_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  contractTerms: text("contract_terms"),
  customerSignature: text("customer_signature"),
  providerSignature: text("provider_signature"),
  signedAt: timestamp("signed_at"),
  paymentStatus: text("payment_status").default("pending"),
  checkoutSessionId: text("checkout_session_id"),
  paymentLinkToken: text("payment_link_token"),
  
  // Scheduling enhancements
  isUrgent: text("is_urgent").default("false"),
  responseDeadline: timestamp("response_deadline"),
  customerEmail: text("customer_email").notNull(),
  customerAccessToken: text("customer_access_token"),
  
  // Deposit management
  depositAmount: integer("deposit_amount").default(100),
  depositStatus: text("deposit_status").default("pending"),
  depositCheckoutSessionId: text("deposit_checkout_session_id"),
  depositPaidAt: timestamp("deposit_paid_at"),
  
  // Appointment tracking
  appointmentDateTime: timestamp("appointment_date_time"),
  previousAppointmentDateTime: timestamp("previous_appointment_date_time"),
  rescheduleCount: integer("reschedule_count").default(0),
  rescheduledAt: timestamp("rescheduled_at"),
  
  // Cancellation management
  cancellationFee: integer("cancellation_fee").default(0),
  cancellationFeeStatus: text("cancellation_fee_status").default("none"),
  cancelledAt: timestamp("cancelled_at"),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
}).extend({
  appointmentDateTime: z.union([z.date(), z.string()]).optional().transform(val => 
    val ? (typeof val === 'string' ? new Date(val) : val) : undefined
  ),
  responseDeadline: z.union([z.date(), z.string(), z.null()]).optional().transform(val => 
    val ? (typeof val === 'string' ? new Date(val) : val) : null
  ),
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

export const providerSessions = pgTable("provider_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertProviderSessionSchema = createInsertSchema(providerSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertProviderSession = z.infer<typeof insertProviderSessionSchema>;
export type ProviderSession = typeof providerSessions.$inferSelect;

export const customerVerificationCodes = pgTable("customer_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerVerificationCodeSchema = createInsertSchema(customerVerificationCodes).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomerVerificationCode = z.infer<typeof insertCustomerVerificationCodeSchema>;
export type CustomerVerificationCode = typeof customerVerificationCodes.$inferSelect;
