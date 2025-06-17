import {
  pgTable,
  varchar,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
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
  productId: uuid("product_id").references(() => productsTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created").defaultNow(),
});

export const productsCarouselBestSellingTable = pgTable(
  "products_carousel_two",
  {
    id: uuid("id").notNull().primaryKey().unique(),
    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created").defaultNow(),
  }
);

export const productsCarouselTopRatedTable = pgTable(
  "products_carousel_three",
  {
    id: uuid("id").notNull().primaryKey().unique(),
    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created").defaultNow(),
  }
);

export const newArrivalCardTable = pgTable("new_arrival_card", {
  id: uuid("id").notNull().primaryKey().unique(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created").defaultNow(),
});

export const newBestSellingCardTable = pgTable("new_bestselling_card", {
  id: uuid("id").notNull().primaryKey().unique(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created").defaultNow(),
});

export const newTopRatedCardTable = pgTable("new_toprated_card", {
  id: uuid("id").notNull().primaryKey().unique(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created").defaultNow(),
});

export const publicUserTable = pgTable("public_user", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shippingAddressTable = pgTable("shipping_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => publicUserTable.id),
  fullName: text("full_name").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  phone: text("phone").notNull(),
});

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  note: text("note"),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull(),
  total: integer("total").notNull(),
  stripeSessionId: text("stripe_session_id"),
  trackingId: uuid("tracking_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id),
  quantity: integer("quantity").notNull().default(1),
  price: integer("price").notNull(),
});

export const cartTable = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => publicUserTable.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviewsTable = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => publicUserTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
