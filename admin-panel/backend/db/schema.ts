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
  category: text("category").notNull(),
  price: numeric("price").notNull(),
  details: text("details").notNull(),
  imageUrl: text("imageUrl"),
  imagePublicId: text("imagePublicId"),
  videoUrl: text("videoUrl"),
  videoPublicId: text("videoPublicId"),
  createdAt: timestamp("created").defaultNow(),
});

export const productsCarouselTable = pgTable("products_carousel", {
  id: uuid("id").notNull().primaryKey().unique(),
  productId: uuid("productId")
    .references(() => productsTable.id)
    .notNull(),
  createdAt: timestamp("created").defaultNow(),
});

export const productsCarouselBestSellingTable = pgTable(
  "products_carousel_two",
  {
    id: uuid("id").notNull().primaryKey().unique(),
    productId: uuid("productId")
      .references(() => productsTable.id)
      .notNull(),
    createdAt: timestamp("created").defaultNow(),
  }
);

export const productsCarouselTopRatedTable = pgTable(
  "products_carousel_three",
  {
    id: uuid("id").notNull().primaryKey().unique(),
    productId: uuid("productId")
      .references(() => productsTable.id)
      .notNull(),
    createdAt: timestamp("created").defaultNow(),
  }
);
