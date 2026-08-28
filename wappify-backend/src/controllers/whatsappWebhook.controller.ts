import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { isValidTwilioWebhook } from "../services/twilioWhatsapp.service";

// Twilio does not use a GET verification challenge. This is a configuration check.
export const verifyWhatsAppWebhook = (_req: Request, res: Response): void => {
  res.status(200).send("Twilio WhatsApp webhook is ready");
};

/** Receives signed x-www-form-urlencoded WhatsApp webhooks from Twilio. */
export const receiveWhatsAppWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
    const body = Object.fromEntries(new URLSearchParams(rawBody).entries());

    if (!isValidTwilioWebhook(req.header("x-twilio-signature"), body)) {
      console.warn("[WHATSAPP WEBHOOK] Rejected request with an invalid Twilio signature.");
      res.status(401).send("Invalid webhook signature");
      return;
    }

    if (!body.From?.startsWith("whatsapp:")) {
      res.status(200).send("EVENT_RECEIVED");
      return;
    }

    const externalEventId = body.MessageSid || null;
    if (externalEventId) {
      await prisma.webhookEvent.upsert({
        where: { externalEventId },
        update: {},
        create: { payload: body, externalEventId, status: "PENDING" },
      });
    } else {
      await prisma.webhookEvent.create({ data: { payload: body, status: "PENDING" } });
    }

    console.log(`[WHATSAPP WEBHOOK] Event queued${externalEventId ? ` (${externalEventId})` : ""}.`);
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK] Error queuing webhook event:", error);
    if (!res.headersSent) res.status(500).send("Webhook queue unavailable");
  }
};
