/**
 * WhatsApp utility functions for the dashboard.
 * Uses the centralised Twilio WhatsApp sender in the backend.
 */

/**
 * Normalises a phone number: strips non-digits, removes whatsapp: prefix.
 */
export const normalisePhoneNumber = (number: string): string => {
  let cleaned = number.replace(/^whatsapp:/i, "");
  cleaned = cleaned.replace(/\D/g, "");
  return cleaned;
};

/**
 * Generates a shareable wa.me link for a merchant's store.
 */
export const getStoreLink = (
  waNumber: string,
  storeCode: string,
): string => {
  const cleaned = normalisePhoneNumber(waNumber);
  return `https://wa.me/${cleaned}?text=STORE-${storeCode}`;
};

/**
 * Sends a WhatsApp message via the backend API (which uses Meta Cloud API).
 * Used for broadcast/admin features from the dashboard.
 */
export async function sendWhatsAppMessage(
  orgId: string,
  to: string,
  message: string,
): Promise<void> {
  const backendUrl = process.env.BACKEND_API_URL;
  const internalToken = process.env.BACKEND_INTERNAL_API_TOKEN;

  if (!backendUrl || !internalToken) {
    throw new Error("BACKEND_API_URL and BACKEND_INTERNAL_API_TOKEN must be configured");
  }

  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-wappify-internal-token": internalToken,
    },
    body: JSON.stringify({ orgId, to, message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  console.log(`✅ [WA API] Message sent to ${to}`);
}
