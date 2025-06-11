import express from "express";
import cors from "cors";
import passport from "passport";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy } from "passport-jwt";
import bcrypt from "bcryptjs";
import { adminTable, carouselImageTable } from "./db/schema";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from "multer";
import cloudinary from "./cloudinary";
import streamifier from "streamifier";

import { desc } from "drizzle-orm";

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
  "/carousel-Image-Upload",
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

app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ user: req.user });
  }
);

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

app.delete("/carousel-Image-Delete/:id", async (req: any, res: any) => {
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

app.listen(port, () => console.log(`Server is listening on port ${port}`));
