import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[Unable to stringify payload]";
  }
};

// ─────────────────────────────────────────────
// GET /api/webhooks/whatsapp
// Meta webhook verification handshake
// ─────────────────────────────────────────────

export const verifyWhatsAppWebhook = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const mode = String(req.query["hub.mode"] || "");
    const token = String(req.query["hub.verify_token"] || "");
    const challenge = String(req.query["hub.challenge"] || "");

    console.log("[WHATSAPP VERIFY] Incoming verification request");
    console.log("[WHATSAPP VERIFY] Query params:", safeStringify(req.query));

    if (!process.env.WHATSAPP_VERIFY_TOKEN) {
      throw new Error(
        "WHATSAPP_VERIFY_TOKEN is missing in environment variables",
      );
    }

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("[WHATSAPP VERIFY] ✅ Webhook verified successfully");
      res.status(200).send(challenge);
      return;
    }

    console.warn("[WHATSAPP VERIFY] ❌ Verification failed");
    console.warn("[WHATSAPP VERIFY] Received mode   :", mode);
    console.warn("[WHATSAPP VERIFY] Received token  :", token);
    console.warn(
      "[WHATSAPP VERIFY] Expected token :",
      process.env.WHATSAPP_VERIFY_TOKEN,
    );

    res.status(403).json({
      success: false,
      message: "Webhook verification failed: token mismatch",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/webhooks/whatsapp
// Receives all incoming WhatsApp events
// ─────────────────────────────────────────────

export const receiveWhatsAppWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const signature = req.header("x-hub-signature-256");
    const userAgent = req.header("user-agent");

    console.log(
      "\n================ WHATSAPP WEBHOOK RECEIVED ================",
    );
    console.log("[WHATSAPP POST] Timestamp        :", new Date().toISOString());
    console.log("[WHATSAPP POST] User-Agent        :", userAgent || "N/A");
    console.log(
      "[WHATSAPP POST] X-Hub-Signature-256:",
      signature || "N/A (not verified yet)",
    );
    console.log("[WHATSAPP POST] Raw Body:\n", safeStringify(req.body));
    console.log("==========================================================\n");

    const body = req.body;

    // ── Guard: valid JSON body ─────────────────
    if (!body || typeof body !== "object") {
      console.warn("[WHATSAPP POST] Empty or invalid JSON body received");
      res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
      return;
    }

    // ── Guard: must be a WhatsApp Business event ─
    if (body.object !== "whatsapp_business_account") {
      console.warn(
        "[WHATSAPP POST] Unexpected object type — ignoring:",
        body.object,
      );
      res.status(200).json({
        success: true,
        message: "Event ignored: not a WhatsApp Business Account event",
      });
      return;
    }

    // ── Always respond 200 to Meta immediately ───
    // Meta will retry if it doesn't get a 200 within ~20 seconds.
    // We acknowledge first, then process asynchronously.
    res.status(200).json({
      success: true,
      message: "Webhook event received",
    });

    // ── Enqueue the payload into the Database ────
    await prisma.webhookEvent.create({
      data: {
        payload: body,
        status: "PENDING",
      },
    });

    console.log("[WHATSAPP POST] Event successfully queued to DB.");
  } catch (error) {
    console.error("[WHATSAPP POST] Error queuing webhook event:");
    console.error(error);
  }
};
