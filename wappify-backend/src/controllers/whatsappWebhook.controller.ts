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
// POST /api/webhooks/whatsapp
// Receives all incoming WhatsApp events via Twilio
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

    // ── Guard: valid Twilio body ───────────────
    // Twilio sends urlencoded form data, which express.urlencoded puts in req.body
    if (!body || typeof body !== "object") {
      console.warn("[WHATSAPP POST] Empty or invalid body received");
      res.status(400).send("Invalid request body");
      return;
    }

    // Twilio webhooks usually include SmsMessageSid or MessageSid
    if (!body.SmsMessageSid && !body.MessageSid && !body.MessageStatus) {
      console.warn(
        "[WHATSAPP POST] Unexpected payload — ignoring:",
        safeStringify(body)
      );
      res.status(200).send("Event ignored");
      return;
    }

    // ── Always respond to Twilio immediately ───
    // Twilio expects an empty TwiML or 200 OK
    res.status(200).type('text/xml').send('<Response></Response>');

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
