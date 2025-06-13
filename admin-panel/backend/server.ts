import express from "express";
import cors from "cors";
import passport from "passport";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
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
} from "./db/schema";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from "multer";
import cloudinary from "./cloudinary";
import streamifier from "streamifier";
import { alias } from "drizzle-orm/pg-core";

const app = express();
const port = 8080;
const upload = multer({ storage: multer.memoryStorage() });

// CORS and cookie support
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend origin
    credentials: true, // Allow credentials (cookies)
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

// JWT Strategy (Authorization)
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
      expiresIn: "1h", // Token expires in 1 hour
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true in production (HTTPS)
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
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
      console.error("Upload error:", err); // 👈 what's printed here?
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

// app.get("/products", async (req, res) => {
//   try {
//     const products = await db.select().from(productsTable);
//     res.json(products);
//   } catch (err) {
//     console.error("Fetch products error:", err);
//     res.status(500).json({ error: "Failed to fetch products" });
//   }
// });

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

// ______________________All Delete Route___________________________
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

    // Delete from Cloudinary
    const deletions = [];
    if (product.imagePublicId)
      deletions.push(cloudinary.uploader.destroy(product.imagePublicId));
    if (product.videoPublicId)
      deletions.push(cloudinary.uploader.destroy(product.videoPublicId));

    await Promise.all(deletions);

    // Delete from DB
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

app.listen(port, () => console.log(`Server is listening on port ${port}`));
