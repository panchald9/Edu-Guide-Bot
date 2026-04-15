import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, maxAge: sessionTtl },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
          console.log("Login failed: User not found for email:", email);
          return done(null, false);
        }
        if (user.password !== hashPassword(password)) {
          console.log("Login failed: Invalid password for email:", email);
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const hashedPassword = hashPassword(password);
      const [user] = await db.insert(users).values({ email, password: hashedPassword, firstName, lastName }).returning();
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(400).json({ message: "Signup failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ message: "Logged out" }));
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
  });

  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return res.status(404).json({ message: "No account found with that email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.update(users).set({ resetToken: otp, resetTokenExpiry: expiry }).where(eq(users.id, user.id));

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your EduBot Password Reset OTP",
      html: `<p>Your OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: "OTP sent" });
  });

  app.post("/api/reset-password", async (req, res) => {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ message: "Email, OTP, and password are required" });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || user.resetToken !== otp || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await db.update(users)
      .set({ password: hashPassword(password), resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, user.id));

    res.json({ message: "Password reset successful" });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};
