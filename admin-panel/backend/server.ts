import express from "express";
import cors from "cors";
import passport from "passport";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy } from "passport-jwt";
import bcrypt from "bcryptjs";
import { adminTable } from "./db/schema";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from "multer";
import cloudinary from "./cloudinary";
import streamifier from "streamifier";
import { imageTable } from "./db/schema";

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

app.post("/imageUpload", upload.single("file"), async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const streamUpload = (fileBuffer: Buffer): Promise<string> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "shopora_uploads" },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            if (!result?.secure_url) {
              return reject(new Error("Upload failed with no URL"));
            }
            return resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const imageUrl = await streamUpload(file.buffer);
    await db.insert(imageTable).values({ imageUrl: imageUrl });
    res.status(200).json({ url: imageUrl });
  } catch (err: any) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ user: req.user });
  }
);

app.listen(port, () => console.log(`Server is listening on port ${port}`));
