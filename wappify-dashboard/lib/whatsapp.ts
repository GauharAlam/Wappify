/**
 * WhatsApp utility functions for the dashboard.
 * Uses the centralised Meta Cloud API — no per-merchant Twilio credentials.
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
  to: string,
  text: string,
): Promise<void> {
  const response = await fetch("/api/webhook/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  console.log(`✅ [WA API] Message sent to ${to}`);
}
