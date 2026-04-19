import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyWebhookChallenge } from "../services/metaWhatsapp.service";

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[Unable to stringify payload]";
  }
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
    console.log(
      "\n================ WHATSAPP WEBHOOK RECEIVED ================",
    );
    console.log("[WHATSAPP POST] Timestamp        :", new Date().toISOString());
    console.log("[WHATSAPP POST] Raw Body:\n", safeStringify(req.body));
    console.log("==========================================================\n");

    const body = req.body;

    // ── Guard: valid Meta webhook body ───────────────
    if (!body || body.object !== "whatsapp_business_account") {
      console.warn("[WHATSAPP POST] Non-WhatsApp payload — ignoring");
      res.status(200).send("EVENT_RECEIVED");
      return;
    }

    // ── Always respond to Meta immediately ───
    // Meta expects a 200 within 20 seconds. Always ack first.
    res.status(200).send("EVENT_RECEIVED");

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
    // If we haven't responded yet, send 200 to prevent Meta retries
    if (!res.headersSent) {
      res.status(200).send("EVENT_RECEIVED");
    }
  }
};
