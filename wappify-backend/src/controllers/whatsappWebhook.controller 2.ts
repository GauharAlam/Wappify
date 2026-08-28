import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyWebhookChallenge } from "../services/metaWhatsapp.service";

const verifyMetaSignature = (rawBody: Buffer, signature: string | undefined) => {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !signature?.startsWith("sha256=")) return false;

  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const getWhatsAppMessageId = (body: unknown): string | null => {
  if (!body || typeof body !== "object") return null;

  const payload = body as {
    entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ id?: string }> } }> }>;
  };

  return payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id ?? null;
};

// ─────────────────────────────────────────────
// GET /api/webhooks/whatsapp
// Meta Cloud API webhook verification challenge.
// Meta sends ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
// You must respond with the challenge value.
// ─────────────────────────────────────────────

export const verifyWhatsAppWebhook = (
  req: Request,
  res: Response,
): void => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  console.log("\n================ META WEBHOOK VERIFY ================");
  console.log("[META VERIFY] Mode     :", mode || "N/A");
  console.log("[META VERIFY] Token    :", token ? "***" : "N/A");
  console.log("[META VERIFY] Challenge:", challenge || "N/A");
  console.log("=====================================================\n");

  const result = verifyWebhookChallenge(mode, token, challenge);

  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send("Verification failed");
  }
};

// ─────────────────────────────────────────────
// POST /api/webhooks/whatsapp
// Receives all incoming WhatsApp events via
// Meta Cloud API (replaces Twilio webhooks).
//
// Meta payload structure:
// {
//   "object": "whatsapp_business_account",
//   "entry": [{
//     "id": "BUSINESS_ACCOUNT_ID",
//     "changes": [{
//       "value": {
//         "messaging_product": "whatsapp",
//         "metadata": {
//           "display_phone_number": "15551234567",
//           "phone_number_id": "PHONE_NUMBER_ID"
//         },
//         "contacts": [{ "profile": { "name": "Customer" }, "wa_id": "91..." }],
//         "messages": [{ "from": "91...", "id": "wamid...", "type": "text", "text": { "body": "..." } }],
//         "statuses": [{ ... }]
//       },
//       "field": "messages"
//     }]
//   }]
// }
// ─────────────────────────────────────────────

export const receiveWhatsAppWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const signature = req.header("x-hub-signature-256");

    if (!verifyMetaSignature(rawBody, signature)) {
      console.warn("[WHATSAPP WEBHOOK] Rejected request with an invalid Meta signature.");
      res.status(401).send("Invalid webhook signature");
      return;
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).send("Invalid JSON payload");
      return;
    }

    if (!body || typeof body !== "object" || (body as { object?: string }).object !== "whatsapp_business_account") {
      console.warn("[WHATSAPP POST] Non-WhatsApp payload — ignoring");
      res.status(200).send("EVENT_RECEIVED");
      return;
    }

    const externalEventId = getWhatsAppMessageId(body);

    if (externalEventId) {
      await prisma.webhookEvent.upsert({
        where: { externalEventId },
        update: {},
        create: { payload: body as object, externalEventId, status: "PENDING" },
      });
    } else {
      await prisma.webhookEvent.create({ data: { payload: body as object, status: "PENDING" } });
    }

    console.log(`[WHATSAPP WEBHOOK] Event queued${externalEventId ? ` (${externalEventId})` : ""}.`);
    // Acknowledge only after the durable queue write succeeds. If the write
    // fails, Meta receives a retryable response instead of silently losing work.
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("[WHATSAPP POST] Error queuing webhook event:");
    console.error(error);
    // Meta retries non-2xx webhook deliveries, which is safer than dropping an event.
    if (!res.headersSent) {
      res.status(500).send("Webhook queue unavailable");
    }
  }
};
