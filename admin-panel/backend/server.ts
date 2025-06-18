import express from "express";
import cors from "cors";
import passport from "passport";
import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy } from "passport-jwt";
import bcrypt from "bcryptjs";
import {
  adminTable,
  carouselImageTable,
  productsTable,
  productsCarouselTable,
  productsCarouselBestSellingTable,
  productsCarouselTopRatedTable,
  newArrivalCardTable,
  newBestSellingCardTable,
  newTopRatedCardTable,
  publicUserTable,
  cartTable,
  ordersTable,
  orderItemsTable,
  shippingAddressTable,
  reviewsTable,
} from "./db/schema";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from "multer";
import cloudinary from "./cloudinary";
import streamifier from "streamifier";
import { alias } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import http from "http";

const app = express();
const port = 8080;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], 
    credentials: true,
  },
});

const users = new Map();

const upload = multer({ storage: multer.memoryStorage() });

const stripe = new Stripe(
  "sk_test_51RaiPvQgUXG7lLBVLysldurnjmGDw8N1UH55OvxM0feI0cqP3U4P5uiCCUwGqVSHfjV2cS2xxwX9tePXQPbLe6bn00QtkFIEBG"
);

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
  }
}

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());
app.use(cookieParser());

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const admin = await db.query.adminTable.findFirst({
          where: (fields, { eq }) => eq(fields.email, email),
        });
        if (!admin) {
          return done(null, false, { message: "Incorrect email" });
        }

        const isValid = bcrypt.compareSync(password, admin.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, admin);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  "public-local",
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      const user = await db.query.publicUserTable.findFirst({
        where: (fields, { eq }) => eq(fields.email, email),
      });
      if (!user) return done(null, false, { message: "Incorrect email" });

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    }
  )
);

const cookieExtractor = (req: any) => {
  return req.cookies?.token || null;
};

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: "hello_world",
    },
    async (payload, done) => {
      try {
        const admin = await db.query.adminTable.findFirst({
          where: (fields, { eq }) => eq(fields.id, payload.id),
        });

        if (!admin) {
          console.log("No admin found for ID:", payload.id);
          return done(null, false, { message: "Token invalid" });
        }

        return done(null, admin);
      } catch (err) {
        console.error("Error in JWT strategy:", err);
        return done(err, false);
      }
    }
  )
);

passport.use(
  "public-jwt",
  new JwtStrategy(
    {
      jwtFromRequest: (req) => req.cookies?.publictoken || null,
      secretOrKey: "hello_world_two",
    },
    async (payload, done) => {
      const user = await db.query.publicUserTable.findFirst({
        where: (fields, { eq }) => eq(fields.id, payload.id),
      });
      if (!user) return done(null, false, { message: "Token invalid" });
      return done(null, user);
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db
      .select()
      .from(adminTable)
      .where(eq(adminTable.id, id))
      .then((rows) => rows[0]);

    if (!user) return done(new Error("User not found"));
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ______________________All Post Route_______________________

app.post("/log-in", async (req, res, next) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err || !user) {
      return res.status(401).json({ message: info?.message || "Login failed" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, "hello_world", {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  })(req, res, next);
});

app.post("/log-out", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

app.post(
  "/carousel-image-upload",
  upload.single("file"),
  async (req: any, res: any) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const streamUpload = (
      fileBuffer: Buffer
    ): Promise<{ url: string; public_id: string }> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "shopora_uploads" },
          (error, result) => {
            if (error) return reject(error);
            if (!result?.secure_url || !result.public_id)
              return reject(new Error("Upload failed"));
            resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    try {
      const { url, public_id } = await streamUpload(file.buffer);
      await db.insert(carouselImageTable).values({
        imageUrl: url,
        publicId: public_id,
      });

      res.status(200).json({ url: url, publicId: public_id });
    } catch (err: any) {
      res.status(500).json({
        error: "Upload failed",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

app.post(
  "/add-products",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req: any, res: any) => {
    const image = req.files?.file?.[0];
    const video = req.files?.video?.[0];
    const { name, category, price, details } = req.body;

    if (!image || !name || !price || !details || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const streamUpload = (
      fileBuffer: Buffer,
      folder: string
    ): Promise<{ url: string; public_id: string }> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) return reject(error);
            if (!result?.secure_url || !result.public_id)
              return reject(new Error("Upload failed"));
            resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    try {
      const { url: imageUrl, public_id: imagePublicId } = await streamUpload(
        image.buffer,
        "shopora_product"
      );

      let videoUrl: string | null = null;
      let videoPublicId: string | null = null;

      if (video) {
        const uploadedVideo = await streamUpload(
          video.buffer,
          "shopora_product_video"
        );
        videoUrl = uploadedVideo.url;
        videoPublicId = uploadedVideo.public_id;
      }

      await db.insert(productsTable).values({
        id: crypto.randomUUID(),
        name,
        category,
        price: price.toString(),
        details,
        imageUrl,
        imagePublicId,
        videoUrl,
        videoPublicId,
      });

      return res.status(200).json({ message: "Product uploaded successfully" });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post("/add-to-carousel-newArrival", async (req: any, res: any) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID required" });
    }
    const product = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, productId),
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found in database" });
    }
    const exists = await db.query.productsCarouselTable.findFirst({
      where: (fields, { eq }) => eq(fields.productId, productId),
    });
    if (exists) {
      return res.status(400).json({ error: "Product already in carousel" });
    }
    await db.insert(productsCarouselTable).values({
      id: crypto.randomUUID(),
      productId,
    });
    res.status(200).json({ message: "Product added to carousel" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
});

app.post("/add-to-carousel-bestSelling", async (req: any, res: any) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID required" });
    }

    const product = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, productId),
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found in database" });
    }

    const exists = await db.query.productsCarouselBestSellingTable.findFirst({
      where: (fields, { eq }) => eq(fields.productId, productId),
    });
    if (exists) {
      return res
        .status(400)
        .json({ error: "Product already in best selling carousel" });
    }

    await db.insert(productsCarouselBestSellingTable).values({
      id: crypto.randomUUID(),
      productId,
    });

    res.status(200).json({ message: "Product added to best selling carousel" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
});

app.post("/add-to-carousel-topRated", async (req: any, res: any) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID required" });
    }

    const product = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, productId),
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found in database" });
    }

    const exists = await db.query.productsCarouselTopRatedTable.findFirst({
      where: (fields, { eq }) => eq(fields.productId, productId),
    });
    if (exists) {
      return res
        .status(400)
        .json({ error: "Product already in top rated carousel" });
    }

    await db.insert(productsCarouselTopRatedTable).values({
      id: crypto.randomUUID(),
      productId,
    });

    res.status(200).json({ message: "Product added to top rated carousel" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
});

app.post("/add-to-card-newArrival", async (req: any, res: any) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ error: "Product ID required" });

    const product = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, productId),
    });
    if (!product)
      return res.status(404).json({ error: "Product not found in database" });

    const exists = await db.query.newArrivalCardTable.findFirst({
      where: (fields, { eq }) => eq(fields.productId, productId),
    });
    if (exists)
      return res
        .status(400)
        .json({ error: "Product already in new arrival card" });

    const current = await db.select().from(newArrivalCardTable);
    if (current.length >= 6)
      return res.status(400).json({ error: "Maximum 6 products allowed" });

    await db.insert(newArrivalCardTable).values({
      id: crypto.randomUUID(),
      productId,
    });

    res.status(200).json({ message: "Product added to new arrival card" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
});

app.post("/add-to-card-bestSelling", async (req: any, res: any) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ error: "Product ID required" });

    const product = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, productId),
    });
    if (!product)
      return res.status(404).json({ error: "Product not found in database" });

    const exists = await db.query.newBestSellingCardTable.findFirst({
      where: (fields, { eq }) => eq(fields.productId, productId),
    });
    if (exists)
      return res
        .status(400)
        .json({ error: "Product already in best selling card" });

    const current = await db.select().from(newBestSellingCardTable);
    if (current.length >= 6)
      return res.status(400).json({ error: "Maximum 6 products allowed" });

    await db.insert(newBestSellingCardTable).values({
      id: crypto.randomUUID(),
      productId,
    });

    res.status(200).json({ message: "Product added to best selling card" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
});

app.post("/add-to-card-topRated", async (req: any, res: any) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ error: "Product ID required" });

    const product = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, productId),
    });
    if (!product)
      return res.status(404).json({ error: "Product not found in database" });

    const exists = await db.query.newTopRatedCardTable.findFirst({
      where: (fields, { eq }) => eq(fields.productId, productId),
    });
    if (exists)
      return res
        .status(400)
        .json({ error: "Product already in top rated card" });

    const current = await db.select().from(newTopRatedCardTable);
    if (current.length >= 6)
      return res.status(400).json({ error: "Maximum 6 products allowed" });

    await db.insert(newTopRatedCardTable).values({
      id: crypto.randomUUID(),
      productId,
    });

    res.status(200).json({ message: "Product added to top rated card" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
});

// ___________________All Patch Route_____________________

app.patch(
  "/products/:id",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req: any, res: any) => {
    const { id } = req.params;
    const { name, category, price, details } = req.body;
    const image = req.files?.file?.[0];
    const video = req.files?.video?.[0];

    try {
      const product = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, id))
        .then((r) => r[0]);

      if (!product) return res.status(404).json({ error: "Product not found" });

      const updates: any = {};
      if (name) updates.name = name;
      if (category) updates.category = category;
      if (price) updates.price = price.toString();
      if (details) updates.details = details;

      const streamUpload = (
        fileBuffer: Buffer,
        folder: string
      ): Promise<{ url: string; public_id: string }> => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error: any, result: any) => {
              if (error) return reject(error);
              if (!result?.secure_url || !result.public_id)
                return reject(new Error("Upload failed"));
              resolve({ url: result.secure_url, public_id: result.public_id });
            }
          );
          streamifier.createReadStream(fileBuffer).pipe(stream);
        });
      };

      if (image) {
        if (product.imagePublicId) {
          await cloudinary.uploader.destroy(product.imagePublicId);
        }
        const { url, public_id } = await streamUpload(
          image.buffer,
          "shopora_product"
        );
        updates.imageUrl = url;
        updates.imagePublicId = public_id;
      }

      if (video) {
        if (product.videoPublicId) {
          await cloudinary.uploader.destroy(product.videoPublicId);
        }
        const { url, public_id } = await streamUpload(
          video.buffer,
          "shopora_product_video"
        );
        updates.videoUrl = url;
        updates.videoPublicId = public_id;
      }

      await db
        .update(productsTable)
        .set(updates)
        .where(eq(productsTable.id, id));

      res.json({ message: "Product updated successfully" });
    } catch (err) {
      console.error("Edit product error:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// ________________________All Get Route________________________

app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ user: req.user });
  }
);

app.get("/products", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .orderBy(desc(productsTable.createdAt));
    res.json(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/product/:id", async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const product = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, id),
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product" });
  }
});

app.get("/products-for-searchbox", async (req, res) => {
  const query = req.query.q?.toString().trim() || "";

  try {
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        price: productsTable.price,
        imageUrl: productsTable.imageUrl,
      })
      .from(productsTable)
      .where(
        query
          ? sql`${productsTable.name} ILIKE ${"%" + query + "%"}`
          : undefined
      )
      .orderBy(desc(productsTable.createdAt))
      .limit(5);

    res.json(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/carousel-images", async (req, res) => {
  try {
    const images = await db
      .select()
      .from(carouselImageTable)
      .orderBy(desc(carouselImageTable.createdAt));
    res.json(images);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error occurred";

    res.status(500).json({
      error: "Could not fetch images",
      details: message,
    });
  }
});

app.get("/carousel-products-newArrival", async (req, res) => {
  try {
    const carousel = alias(productsCarouselTable, "carousel");
    const product = alias(productsTable, "product");
    const result = await db
      .select()
      .from(carousel)
      .innerJoin(product, () => eq(carousel.productId, product.id))
      .orderBy(desc(carousel.createdAt));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err });
  }
});

app.get("/carousel-products-bestSelling", async (req, res) => {
  try {
    const carousel = alias(productsCarouselBestSellingTable, "carousel");
    const product = alias(productsTable, "product");
    const result = await db
      .select()
      .from(carousel)
      .innerJoin(product, () => eq(carousel.productId, product.id))
      .orderBy(desc(carousel.createdAt));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err });
  }
});

app.get("/carousel-products-topRated", async (req, res) => {
  try {
    const carousel = alias(productsCarouselTopRatedTable, "carousel");
    const product = alias(productsTable, "product");
    const result = await db
      .select()
      .from(carousel)
      .innerJoin(product, () => eq(carousel.productId, product.id))
      .orderBy(desc(carousel.createdAt));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err });
  }
});

app.get("/card-products-newArrival", async (req: any, res: any) => {
  try {
    const carousel = alias(newArrivalCardTable, "carousel");
    const product = alias(productsTable, "product");

    const result = await db
      .select()
      .from(carousel)
      .innerJoin(product, () => eq(carousel.productId, product.id))
      .orderBy(desc(carousel.createdAt));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err });
  }
});

app.get("/card-products-bestSelling", async (req: any, res: any) => {
  try {
    const carousel = alias(newBestSellingCardTable, "carousel");
    const product = alias(productsTable, "product");

    const result = await db
      .select()
      .from(carousel)
      .innerJoin(product, () => eq(carousel.productId, product.id))
      .orderBy(desc(carousel.createdAt));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err });
  }
});

app.get("/card-products-topRated", async (req: any, res: any) => {
  try {
    const carousel = alias(newTopRatedCardTable, "carousel");
    const product = alias(productsTable, "product");

    const result = await db
      .select()
      .from(carousel)
      .innerJoin(product, () => eq(carousel.productId, product.id))
      .orderBy(desc(carousel.createdAt));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err });
  }
});

// ________________________All Delete Route___________________________

app.delete("/carousel-image-delete/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const image = await db
      .select()
      .from(carouselImageTable)
      .where(eq(carouselImageTable.id, id));

    if (!image.length) {
      return res.status(404).json({ error: "Image not found" });
    }
    const publicId = image[0].publicId;
    await cloudinary.uploader.destroy(publicId);
    await db.delete(carouselImageTable).where(eq(carouselImageTable.id, id));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to delete image",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

app.delete("/products/:id", async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const product = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .then((r) => r[0]);

    if (!product) return res.status(404).json({ error: "Product not found" });

    const deletions = [];
    if (product.imagePublicId)
      deletions.push(cloudinary.uploader.destroy(product.imagePublicId));
    if (product.videoPublicId)
      deletions.push(cloudinary.uploader.destroy(product.videoPublicId));

    await Promise.all(deletions);

    await db.delete(productsTable).where(eq(productsTable.id, id));

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

app.delete("/carousel-products-newArrival/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db
      .delete(productsCarouselTable)
      .where(eq(productsCarouselTable.id, id));

    res.status(200).json({ message: "Deleted from carousel" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete carousel product" });
  }
});

app.delete("/carousel-products-bestSelling/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db
      .delete(productsCarouselBestSellingTable)
      .where(eq(productsCarouselBestSellingTable.id, id));

    res.status(200).json({ message: "Deleted from best selling carousel" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete best selling product" });
  }
});

app.delete("/carousel-products-topRated/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db
      .delete(productsCarouselTopRatedTable)
      .where(eq(productsCarouselTopRatedTable.id, id));

    res.status(200).json({ message: "Deleted from top rated carousel" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete top rated product" });
  }
});

app.delete("/card-products-newArrival/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(newArrivalCardTable).where(eq(newArrivalCardTable.id, id));
    res.status(200).json({ message: "Deleted from new arrival card" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err });
  }
});

app.delete("/card-products-bestSelling/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db
      .delete(newBestSellingCardTable)
      .where(eq(newBestSellingCardTable.id, id));
    res.status(200).json({ message: "Deleted from best selling card" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err });
  }
});

app.delete("/card-products-topRated/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db
      .delete(newTopRatedCardTable)
      .where(eq(newTopRatedCardTable.id, id));
    res.status(200).json({ message: "Deleted from top rated card" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err });
  }
});

// ________________________Main Ui Backend_________________________

app.post("/public-sign-up", async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const existing = await db.query.publicUserTable.findFirst({
      where: (fields, { eq }) => eq(fields.email, email),
    });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(publicUserTable)
      .values({
        email,
        password: hashedPassword,
      })
      .returning();

    const token = jwt.sign({ id: newUser.id }, "hello_world_two", {
      expiresIn: "1d",
    });

    res
      .cookie("publictoken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        message: "User created",
        user: { id: newUser.id, email: newUser.email },
      });
  } catch (err) {
    console.error("Sign-up error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/public-log-in", (req, res, next) => {
  passport.authenticate("public-local", (err: any, user: any, info: any) => {
    if (err || !user) {
      return res.status(401).json({ message: info?.message || "Login failed" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "hello_world_two",
      {
        expiresIn: "1h",
      }
    );

    res.cookie("publictoken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  })(req, res, next);
});

app.post("/public-log-out", (req, res) => {
  res.clearCookie("publictoken");
  res.json({ message: "Logged out successfully" });
});

app.post(
  "/add-to-cart",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { productId, quantity } = req.body;

      if (!userId || !productId || !quantity) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const existing = await db
        .select()
        .from(cartTable)
        .where(
          and(eq(cartTable.userId, userId), eq(cartTable.productId, productId))
        );

      if (existing.length > 0) {
        await db
          .update(cartTable)
          .set({ quantity: existing[0].quantity + quantity })
          .where(
            and(
              eq(cartTable.userId, userId),
              eq(cartTable.productId, productId)
            )
          );
      } else {
        await db.insert(cartTable).values({
          userId,
          productId,
          quantity,
        });
      }

      return res.status(200).json({ message: "Added to cart" });
    } catch (err) {
      console.error("Error adding to cart:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post(
  "/checkout-cod",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      cartItems,
      total,
      fullName,
      phone,
      address,
      city,
      postalCode,
      note,
    } = req.body;
    const shippingAddress = `${address}, ${city}, ${postalCode}`;
    const orderId = uuidv4();
    const trackingId = uuidv4();

    try {
      await db.insert(ordersTable).values({
        id: orderId,
        userId,
        trackingId,
        total: Math.round(total * 100),
        shippingAddress,
        fullName,
        phone,
        note,
        paymentMethod: "cod",
        status: "placed",
        createdAt: new Date(),
      });

      for (const item of cartItems) {
        await db.insert(orderItemsTable).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: Math.round(item.price * 100),
        });
      }

      await db.delete(cartTable).where(eq(cartTable.userId, userId));

      res.status(200).json({ orderId, trackingId });
    } catch (err) {
      console.error("COD Checkout Error:", err);
      res.status(500).json({ message: "Failed to place COD order" });
    }
  }
);

app.post(
  "/checkout-stripe-session",
  passport.authenticate("public-jwt", { session: false }),
  async (req, res) => {
    const {
      cartItems,
      total,
      fullName,
      phone,
      address,
      city,
      postalCode,
      note,
    } = req.body;
    const shippingAddress = `${address}, ${city}, ${postalCode}`;
    const orderId = uuidv4();
    const trackingId = uuidv4();

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: cartItems.map((item: any) => ({
          price_data: {
            currency: "usd",
            product_data: { name: item.name },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        success_url: `http://localhost:3000/payment-success?sessionId={CHECKOUT_SESSION_ID}&orderId=${orderId}&trackingId=${trackingId}`,
        cancel_url: `http://localhost:3000/checkout`,
        metadata: {
          orderId,
          trackingId,
          fullName,
          phone,
          shippingAddress,
          note,
          cartItems: JSON.stringify(cartItems),
        },
      });

      res.status(200).json({ sessionUrl: session.url });
    } catch (err) {
      console.error("Stripe Session Error:", err);
      res.status(500).json({ message: "Failed to create Stripe session" });
    }
  }
);

app.post(
  "/checkout-stripe-save",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      orderId,
      trackingId,
      cartItems,
      total,
      fullName,
      phone,
      shippingAddress,
      note,
      stripeSessionId,
    } = req.body;

    console.log("🔄 Saving order with items:", cartItems);

    try {
      await db.insert(ordersTable).values({
        id: orderId,
        userId,
        trackingId,
        total: Math.round(total * 100),
        shippingAddress,
        fullName,
        phone,
        note,
        paymentMethod: "stripe",
        status: "paid",
        stripeSessionId,
        createdAt: new Date(),
      });

      for (const item of cartItems) {
        console.log("📦 Inserting item:", item);

        await db.insert(orderItemsTable).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: Math.round(item.price * 100),
        });
      }

      await db.delete(cartTable).where(eq(cartTable.userId, userId));

      res.status(200).json({ message: "Stripe order saved successfully" });
    } catch (err) {
      console.error("❌ Save Stripe Order Error:", err);
      res.status(500).json({ message: "Failed to save Stripe order" });
    }
  }
);

app.patch(
  "/update-cart-item",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId || !productId || quantity < 1) {
      return res.status(400).json({ error: "Invalid input" });
    }

    await db
      .update(cartTable)
      .set({ quantity })
      .where(
        and(eq(cartTable.userId, userId), eq(cartTable.productId, productId))
      );

    res.status(200).json({ message: "Updated" });
  }
);

app.patch(
  "/user-profile",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { fullName, phone, shippingAddress } = req.body;

    if (!fullName || !phone || !shippingAddress) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await db.query.shippingAddressTable.findFirst({
      where: (fields, { eq }) => eq(fields.userId, userId),
    });

    if (existing) {
      await db
        .update(shippingAddressTable)
        .set({
          fullName,
          phone,
          addressLine1: shippingAddress,
          city: "N/A",
          postalCode: "N/A",
          country: "N/A",
        })
        .where(eq(shippingAddressTable.userId, userId));
    } else {
      await db.insert(shippingAddressTable).values({
        userId,
        fullName,
        phone,
        addressLine1: shippingAddress,
        city: "N/A",
        postalCode: "N/A",
        country: "N/A",
      });
    }

    res.status(200).json({ message: "Profile updated" });
  }
);

app.get(
  "/public-protected",
  passport.authenticate("public-jwt", { session: false }),
  (req, res) => {
    res.json({ user: req.user });
  }
);

app.get("/cart-count", async (req: any, res: any) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const result = await db
    .select({ count: sql`COUNT(*)` })
    .from(cartTable)
    .where(eq(cartTable.userId, userId));

  res.json({ count: result[0].count });
});

app.get(
  "/cart-items",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const items = await db
      .select({
        productId: cartTable.productId,
        quantity: cartTable.quantity,
        name: productsTable.name,
        imageUrl: productsTable.imageUrl,
        price: productsTable.price,
      })
      .from(cartTable)
      .innerJoin(productsTable, eq(cartTable.productId, productsTable.id))
      .where(eq(cartTable.userId, userId));

    res.json(items);
  }
);

app.get("/stripe-session-details", async (req: any, res: any) => {
  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ message: "Missing sessionId" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata) {
      return res.status(400).json({ message: "No metadata found in session" });
    }

    res.status(200).json({
      orderId: session.metadata.orderId,
      trackingId: session.metadata.trackingId,
      fullName: session.metadata.fullName,
      phone: session.metadata.phone,
      shippingAddress: session.metadata.shippingAddress,
      note: session.metadata.note,
      total: session.amount_total! / 100,
      cartItems: JSON.parse(session.metadata.cartItems || "[]"),
    });
  } catch (err) {
    console.error("Stripe session fetch error:", err);
    res.status(500).json({ message: "Failed to retrieve session" });
  }
});

app.get(
  "/user-orders",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, userId))
      .orderBy(desc(ordersTable.createdAt));

    if (orders.length === 0) return res.json([]);

    const orderItemsWithProduct = await db
      .select({
        orderId: orderItemsTable.orderId,
        quantity: orderItemsTable.quantity,
        price: orderItemsTable.price,
        name: productsTable.name,
        imageUrl: productsTable.imageUrl,
      })
      .from(orderItemsTable)
      .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(
        inArray(
          orderItemsTable.orderId,
          orders.map((o) => o.id)
        )
      );

    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: orderItemsWithProduct.filter((item) => item.orderId === order.id),
    }));

    res.json(ordersWithItems);
  }
);

app.get(
  "/user-profile",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.query.publicUserTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, userId),
    });

    const shipping = await db.query.shippingAddressTable.findFirst({
      where: (fields, { eq }) => eq(fields.userId, userId),
    });

    res.json({
      email: user?.email,
      fullName: shipping?.fullName,
      phone: shipping?.phone,
      shippingAddress: shipping
        ? `${shipping.addressLine1}, ${shipping.city}, ${shipping.postalCode}`
        : null,
    });
  }
);

app.delete(
  "/remove-cart-item",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ error: "Missing productId or user not authenticated" });
    }

    try {
      const deleted = await db
        .delete(cartTable)
        .where(
          and(eq(cartTable.userId, userId), eq(cartTable.productId, productId))
        );

      return res
        .status(200)
        .json({ message: "Item removed from cart", deleted });
    } catch (err) {
      console.error("Delete error:", err);
      return res.status(500).json({ error: "Failed to delete cart item" });
    }
  }
);

app.post(
  "/reviews",
  passport.authenticate("public-jwt", { session: false }),
  async (req: any, res: any) => {
    const userId = req.user?.id;
    const { productId, rating, comment } = req.body;

    if (!userId || !productId || !rating) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await db.insert(reviewsTable).values({
      id: uuidv4(),
      productId,
      userId,
      rating,
      comment,
    });

    res.json({ message: "Review submitted" });
  }
);

app.get("/reviews/:productId", async (req: any, res: any) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ message: "Missing productId" });
  }

  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, productId));

    return res.status(200).json(reviews);
  } catch (err) {
    console.error("Review fetch error:", err);
    return res.status(500).json({ message: "Failed to load reviews" });
  }
});

app.get("/admin/all-orders", async (req, res) => {
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        fullName: ordersTable.fullName,
        phone: ordersTable.phone,
        shippingAddress: ordersTable.shippingAddress,
        paymentMethod: ordersTable.paymentMethod,
        status: ordersTable.status,
        total: ordersTable.total,
        trackingId: ordersTable.trackingId,
        createdAt: ordersTable.createdAt,
        email: publicUserTable.email,
      })
      .from(ordersTable)
      .leftJoin(publicUserTable, eq(ordersTable.userId, publicUserTable.id))
      .orderBy(desc(ordersTable.createdAt));

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            productId: orderItemsTable.productId,
            quantity: orderItemsTable.quantity,
            price: orderItemsTable.price,
            name: productsTable.name,
            imageUrl: productsTable.imageUrl,
          })
          .from(orderItemsTable)
          .leftJoin(
            productsTable,
            eq(orderItemsTable.productId, productsTable.id)
          )
          .where(eq(orderItemsTable.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

app.patch("/update-order-status/:orderId", async (req: any, res: any) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Missing status" });
  }

  try {
    const updated = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, orderId));

    if (updated.rowCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated" });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

app.get("/admin/all-reviews", async (req, res) => {
  try {
    const reviews = await db
      .select({
        id: reviewsTable.id,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        email: publicUserTable.email,
      })
      .from(reviewsTable)
      .leftJoin(publicUserTable, eq(reviewsTable.userId, publicUserTable.id))
      .orderBy(desc(reviewsTable.createdAt));

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

app.delete("/admin/reviews/:id", async (req, res) => {
  const reviewId = req.params.id;

  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    console.error("Delete review failed:", err);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (email) => {
    users.set(socket.id, email);
    console.log(`Registered: ${email}`);
    io.emit("activeUsers", Array.from(new Set(users.values())));
  });

  socket.on("message", ({ to, from, message }) => {
    console.log(`Message from ${from} to ${to}: ${message}`);

    for (const [socketId, email] of users.entries()) {
      if (email === to) {
        io.to(socketId).emit("message", { from, to, message });
      }
    }

    for (const [socketId, email] of users.entries()) {
      if (email === from) {
        io.to(socketId).emit("message", { from, to, message });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    users.delete(socket.id);
    io.emit("activeUsers", Array.from(new Set(users.values())));
  });
});

server.listen(port, () => console.log(`Server is listening on port ${port}`));
