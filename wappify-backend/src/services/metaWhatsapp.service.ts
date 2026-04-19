import axios from "axios";

// ─────────────────────────────────────────────
// Meta WhatsApp Cloud API — Centralised Sender
//
// Wappify owns a single WhatsApp Business Account
// connected via Meta Cloud API. All merchant messages
// are sent through this shared account.
//
// Env vars required (platform-level, NOT per-merchant):
//   WHATSAPP_ACCESS_TOKEN   — Meta Graph API bearer token
//   WHATSAPP_PHONE_NUMBER_ID — The Phone Number ID from Meta
// ─────────────────────────────────────────────

const META_API_VERSION = "v19.0";

const getConfig = () => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set in .env"
    );
  }

  return { accessToken, phoneNumberId };
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Normalises a phone number to E.164 format.
 * Strips any "whatsapp:" prefix, non-numeric chars, and ensures a leading "+".
 *
 * Examples:
 *   "whatsapp:+919876543210"  → "919876543210"
 *   "+91 98765 43210"        → "919876543210"
 *   "919876543210"           → "919876543210"
 */
export const normalisePhoneNumber = (raw: string): string => {
  // Remove whatsapp: prefix if present
  let cleaned = raw.replace(/^whatsapp:/i, "");
  // Remove all non-digit characters
  cleaned = cleaned.replace(/\D/g, "");
  return cleaned;
};

// ─────────────────────────────────────────────
// Core: Send a text message via Meta Cloud API
// ─────────────────────────────────────────────

export const sendMetaTextMessage = async (
  to: string,
  message: string,
): Promise<void> => {
  const { accessToken, phoneNumberId } = getConfig();
  const recipientPhone = normalisePhoneNumber(to);

  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const messageId = response.data?.messages?.[0]?.id || "unknown";
    console.log(
      `[META WA] ✅ Message sent to ${recipientPhone} | ID: ${messageId}`,
    );
  } catch (error: any) {
    const errData = error?.response?.data?.error;
    const errMsg = errData
      ? `${errData.code}: ${errData.message}`
      : error?.message || "Unknown error";

    console.error(`[META WA] ❌ Failed to send message to ${recipientPhone}`);
    console.error(`[META WA] Error: ${errMsg}`);

    throw new Error(`Meta WhatsApp send failed: ${errMsg}`);
  }
};

// ─────────────────────────────────────────────
// Verify Webhook — GET handler for Meta challenge
// Meta sends a GET request with hub.mode, hub.challenge,
// hub.verify_token to confirm your webhook URL.
// ─────────────────────────────────────────────

export const verifyWebhookChallenge = (
  mode: string | undefined,
  token: string | undefined,
  challenge: string | undefined,
): string | null => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[META WA] ✅ Webhook verification successful");
    return challenge || null;
  }

  console.warn("[META WA] ❌ Webhook verification failed — token mismatch");
  return null;
};
