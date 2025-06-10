import { pgTable, varchar, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const adminTable = pgTable("admin", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
});

export const imageTable = pgTable("image", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  imageUrl: text("imageUrl").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
});
