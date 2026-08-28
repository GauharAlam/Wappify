import twilio from "twilio";

const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!accountSid || !authToken || !whatsappNumber) {
    throw new Error("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER must be set");
  }
  return { accountSid, authToken, whatsappNumber };
};

const asWhatsAppAddress = (phoneNumber: string): string => {
  const digits = phoneNumber.replace(/^whatsapp:/i, "").replace(/\D/g, "");
  if (!digits) throw new Error("A valid WhatsApp phone number is required");
  return `whatsapp:+${digits}`;
};

export const sendTwilioTextMessage = async (to: string, body: string): Promise<string> => {
  const { accountSid, authToken, whatsappNumber } = getTwilioConfig();
  const message = await twilio(accountSid, authToken).messages.create({
    from: asWhatsAppAddress(whatsappNumber),
    to: asWhatsAppAddress(to),
    body,
  });
  return message.sid;
};

/** TWILIO_WEBHOOK_URL must exactly match the callback URL set in Twilio. */
export const isValidTwilioWebhook = (signature: string | undefined, params: Record<string, string>): boolean => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL;
  return Boolean(authToken && webhookUrl && signature && twilio.validateRequest(authToken, signature, webhookUrl, params));
};

export const normaliseTwilioWhatsAppNumber = (address: string): string =>
  address.replace(/^whatsapp:/i, "").replace(/\D/g, "");
