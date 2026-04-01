import { NextFunction, Request, Response } from "express";
import { routeMessage } from "../services/messageRouter.service";
import { sendMediaAcknowledgement } from "../services/whatsapp.service";

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

    // ── Process entries ──────────────────────────
    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change?.value;

        // ── Incoming messages ──────────────────
        if (Array.isArray(value?.messages)) {
          const contacts: any[] = Array.isArray(value?.contacts)
            ? value.contacts
            : [];

          for (const message of value.messages) {
            const from: string = message?.from || "";
            const messageId: string = message?.id || "";
            const timestamp: string = message?.timestamp || "";
            const type: string = message?.type || "";

            // Resolve customer display name from contacts array
            const contact = contacts.find((c: any) => c?.wa_id === from);
            const customerName: string | undefined =
              contact?.profile?.name || undefined;

            console.log("[WHATSAPP MESSAGE] ──────────────────────");
            console.log("[WHATSAPP MESSAGE] From        :", from);
            console.log(
              "[WHATSAPP MESSAGE] Customer    :",
              customerName || "Unknown",
            );
            console.log("[WHATSAPP MESSAGE] Message ID  :", messageId);
            console.log("[WHATSAPP MESSAGE] Timestamp   :", timestamp);
            console.log("[WHATSAPP MESSAGE] Type        :", type);

            if (type === "text") {
              const textBody: string = message?.text?.body || "";
              console.log("[WHATSAPP MESSAGE] Text        :", textBody);

              if (from && textBody) {
                // ── Dispatch to State Machine Router ──
                await routeMessage(from, textBody, customerName);
              } else {
                console.warn(
                  "[WHATSAPP MESSAGE] Skipping: missing 'from' or empty text",
                );
              }
            } else {
              // Non-text messages (image, audio, sticker, etc.)
              console.log(
                `[WHATSAPP MESSAGE] Non-text message type: "${type}"`,
              );

              // Send acknowledgement for media messages
              const mediaTypes = ["image", "video", "audio", "document", "sticker"];
              if (from && mediaTypes.includes(type)) {
                await sendMediaAcknowledgement(from, type);
              } else {
                console.log(
                  `[WHATSAPP MESSAGE] Unsupported message type: "${type}" — Full object:`,
                  safeStringify(message),
                );
              }
            }
          }
        }

        // ── Delivery / read status updates ─────
        if (Array.isArray(value?.statuses)) {
          for (const status of value.statuses) {
            console.log("[WHATSAPP STATUS] ──────────────────────");
            console.log(
              "[WHATSAPP STATUS] Recipient  :",
              status?.recipient_id || "N/A",
            );
            console.log(
              "[WHATSAPP STATUS] Status     :",
              status?.status || "N/A",
            );
            console.log("[WHATSAPP STATUS] Message ID :", status?.id || "N/A");
            console.log(
              "[WHATSAPP STATUS] Timestamp  :",
              status?.timestamp || "N/A",
            );
          }
        }

        // ── Other / unknown change fields ───────
        if (!value?.messages && !value?.statuses) {
          console.log(
            "[WHATSAPP POST] Non-message/status event received:",
            safeStringify(change),
          );
        }
      }
    }
  } catch (error) {
    // Don't call next(error) here — we've already sent 200 to Meta.
    // Log the error and handle it gracefully so Meta doesn't retry.
    console.error("[WHATSAPP POST] Error while processing webhook event:");
    console.error(error);
  }
};
