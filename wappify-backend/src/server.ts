import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import whatsappRoutes from "./routes/whatsapp.routes";
import razorpayRoutes from "./routes/razorpay.routes";
import { ensureSeedData } from "./lib/seed";
import { runQueueProcessor } from "./services/queueProcessor.service";

const app = express();
const PORT = Number(process.env.PORT || 8080);

// ─────────────────────────────────────────────
// Boot-time environment checks
// ─────────────────────────────────────────────

const REQUIRED_ENV_VARS = [
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_NUMBER",
  "GEMINI_API_KEY",
  "DATABASE_URL",
];

REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[BOOT WARNING] "${key}" is not set in .env`);
  }
});

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
app.use(morgan("dev"));

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

// ─────────────────────────────────────────────
// JSON body parsing for all other routes
// ─────────────────────────────────────────────

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

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

// ─────────────────────────────────────────────
// Rate Limiting for Webhooks
// ─────────────────────────────────────────────
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res) => {
    console.warn(`[RATE LIMIT] IP ${req.ip} exceeded webhook limits.`);
    res.status(429).json({ success: false, message: "Too many webhook requests, please try again later." });
  }
});

app.use("/api/webhooks/whatsapp", webhookLimiter, whatsappRoutes);

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

  // Seed mock merchant + products into the DB after server starts.
  // This is non-blocking — a seed failure will log a warning but
  // will NOT crash the server.
  await ensureSeedData();

  // Initialize background queue polling for decoupled webhooks
  runQueueProcessor();
});
