import { pgTable, text, integer, real, boolean, jsonb, varchar } from "drizzle-orm/pg-core";

export const mentorsTable = pgTable("mentors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  experienceYears: integer("experience_years").notNull(),
  rating: real("rating").notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  sessions: integer("sessions").notNull().default(0),
  price: integer("price").notNull(),
  availability: text("availability").notNull(),
  verified: boolean("verified").notNull().default(true),
  bio: text("bio").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull(),
  companyColor: text("company_color").default("#0d9488"),
  match: integer("match").default(90),
});

export const bookingsTable = pgTable("bookings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  mentorId: varchar("mentor_id", { length: 64 }).notNull(),
  mentorName: text("mentor_name").notNull(),
  studentName: text("student_name").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("confirmed"),
  price: integer("price").notNull(),
  meetingUrl: text("meeting_url"),
});

export const reviewsTable = pgTable("reviews", {
  id: varchar("id", { length: 64 }).primaryKey(),
  mentorId: varchar("mentor_id", { length: 64 }).notNull(),
  studentName: text("student_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  date: text("date").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
});

export const messagesTable = pgTable("messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 64 }).notNull(),
  sender: text("sender").notNull(),
  body: text("body").notNull(),
  time: text("time").notNull(),
  mine: boolean("mine").notNull().default(false),
});

export const notificationsTable = pgTable("notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  time: text("time").notNull(),
  unread: boolean("unread").notNull().default(true),
});

export const progressTable = pgTable("progress", {
  id: varchar("id", { length: 64 }).primaryKey(),
  goal: text("goal").notNull(),
  completion: integer("completion").notNull().default(0),
  skills: jsonb("skills").$type<{ name: string; value: number; color?: string }[]>().notNull(),
  nextSteps: jsonb("next_steps").$type<string[]>().notNull(),
});

export type InsertMentor = typeof mentorsTable.$inferInsert;
export type MentorModel = typeof mentorsTable.$inferSelect;

export type InsertBooking = typeof bookingsTable.$inferInsert;
export type BookingModel = typeof bookingsTable.$inferSelect;

export type InsertReview = typeof reviewsTable.$inferInsert;
export type ReviewModel = typeof reviewsTable.$inferSelect;

export type InsertMessage = typeof messagesTable.$inferInsert;
export type MessageModel = typeof messagesTable.$inferSelect;

export type InsertNotification = typeof notificationsTable.$inferInsert;
export type NotificationModel = typeof notificationsTable.$inferSelect;

export type InsertProgress = typeof progressTable.$inferInsert;
export type ProgressModel = typeof progressTable.$inferSelect;