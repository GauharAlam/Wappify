import twilio from "twilio";
import { prisma } from "../lib/prisma";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────

/**
 * Retrieves the Twilio configuration securely from the database for the given merchant.
 */
export const getTwilioConfig = async (
  merchantId: string
): Promise<TwilioConfig> => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      twilioAccountSid: true,
      twilioAuthToken: true,
      whatsappNumber: true,
    },
  });

  if (!merchant?.twilioAccountSid || !merchant?.twilioAuthToken || !merchant?.whatsappNumber) {
    throw new Error(
      `Twilio credentials not configured for merchant: ${merchantId}`
    );
  }

  return {
    accountSid: merchant.twilioAccountSid,
    authToken: merchant.twilioAuthToken,
    whatsappNumber: merchant.whatsappNumber,
  };
};

/**
 * Ensures a phone number is formatted for Twilio WhatsApp (whatsapp:+1234567890).
 */
export const formatWhatsAppNumber = (number: string): string => {
  let cleaned = number.replace(/\D/g, ""); // Remove non-numeric
  if (!number.startsWith("whatsapp:")) {
    // Some regions might require the + symbol. Assume cleaned includes country code.
    return `whatsapp:+${cleaned}`;
  }
  return number;
};
