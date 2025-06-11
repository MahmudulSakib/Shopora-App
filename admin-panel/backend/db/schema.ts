import {
  pgTable,
  varchar,
  uuid,
  text,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";

export const adminTable = pgTable("admin", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const carouselImageTable = pgTable("carousel_image", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  imageUrl: text("imageUrl").notNull(),
  publicId: text("publicId").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productsTable = pgTable("products", {
  id: uuid("id").notNull().primaryKey().unique(),
  name: text("productName").notNull(),
  price: numeric("price").notNull(),
  details: text("details").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("created").defaultNow(),
});
