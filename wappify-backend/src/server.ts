import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import whatsappRoutes from "./routes/whatsapp.routes";
import razorpayRoutes from "./routes/razorpay.routes";
import messagesRoutes from "./routes/messages.routes";
import { ensureSeedData } from "./lib/seed";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";
import { runQueueProcessor } from "./services/queueProcessor.service";

const app = express();
const PORT = Number(process.env.PORT || 8080);

// ─────────────────────────────────────────────
// Boot-time environment checks
// ─────────────────────────────────────────────

const REQUIRED_ENV_VARS = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_NUMBER",
  "TWILIO_WEBHOOK_URL",
  "BACKEND_INTERNAL_API_TOKEN",
  "GEMINI_API_KEY",
  "DATABASE_URL",
  "REDIS_URL",
];

const missingEnvironmentVariables = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingEnvironmentVariables.length > 0) {
  const message = `[BOOT] Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`;
  if (process.env.NODE_ENV === "production") throw new Error(message);
  console.warn(message);
}

// ─────────────────────────────────────────────
// Security & utility middleware
// ─────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: process.env.DASHBOARD_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.set("trust proxy", 1);

// ─────────────────────────────────────────────
// Rate limiting for Twilio webhook traffic
// ─────────────────────────────────────────────
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[RATE LIMIT] Webhook rate limit reached for ${req.ip}.`);
    res.status(429).json({ success: false, message: "Too many webhook requests." });
  },
});

// ─────────────────────────────────────────────
// IMPORTANT: Razorpay webhook MUST be mounted
// BEFORE express.json() so the route receives
// the raw Buffer body needed for HMAC signature
// verification. express.json() would parse and
// discard the raw bytes, breaking the check.
// ─────────────────────────────────────────────

app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  razorpayRoutes,
);

// Twilio signs URL-encoded form fields. This must run before express.urlencoded().
app.use(
  "/api/webhooks/whatsapp",
  webhookLimiter,
  express.raw({ type: "application/x-www-form-urlencoded" }),
  whatsappRoutes,
);

// ─────────────────────────────────────────────
// JSON body parsing for all other routes
// ─────────────────────────────────────────────

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/messages", messagesRoutes);

// ─────────────────────────────────────────────
// Request logger middleware
// ─────────────────────────────────────────────

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(
    `[REQUEST] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`,
  );
  next();
});

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: "wappify-backend",
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health/ready", async (_req: Request, res: Response) => {
  const checks = { database: false, redis: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error: any) {
    console.error("[READINESS] Database check failed:", error?.message || "Unknown error");
  }

  try {
    await redis.ping();
    checks.redis = true;
  } catch (error: any) {
    console.error("[READINESS] Redis check failed:", error?.message || "Unknown error");
  }

  const ready = checks.database && checks.redis;
  res.status(ready ? 200 : 503).json({ success: ready, status: ready ? "ready" : "not_ready", checks });
});

// ─────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────

app.use((req: Request, res: Response) => {
  console.warn(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error("[GLOBAL ERROR]");
  console.error("Method  :", req.method);
  console.error("URL     :", req.originalUrl);
  console.error("Message :", err?.message || "Unknown error");
  console.error("Stack   :", err?.stack || "No stack trace");

  res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.message || "Internal server error",
  });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log("\n🚀 ─────────────────────────────────────────");
  console.log(`   Wappify Backend is running!`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log("─────────────────────────────────────────────");
  console.log(`   Health check   : http://localhost:${PORT}/health`);
  console.log(
    `   WA Webhook     : http://localhost:${PORT}/api/webhooks/whatsapp`,
  );
  console.log(
    `   Razorpay Hook  : http://localhost:${PORT}/api/webhooks/razorpay`,
  );
  console.log("─────────────────────────────────────────────\n");

  // Demo data is explicit and is never allowed in a production process.
  if (process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_SEED === "true") {
    await ensureSeedData();
  }

  // Initialize background queue polling for decoupled webhooks
  runQueueProcessor();
});
