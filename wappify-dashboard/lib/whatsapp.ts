import twilio from "twilio";

/**
 * Ensures a phone number is formatted for Twilio WhatsApp (whatsapp:+1234567890).
 */
const formatWhatsAppNumber = (number: string): string => {
  let cleaned = number.replace(/\D/g, ""); // Remove non-numeric
  if (!number.startsWith("whatsapp:")) {
    return `whatsapp:+${cleaned}`;
  }
  return number;
};

/**
 * Sends a WhatsApp message using the Twilio API.
 */
export async function sendWhatsAppMessage(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  text: string
) {
  try {
    const client = twilio(accountSid, authToken);

    const formattedFrom = formatWhatsAppNumber(from);
    const formattedTo = formatWhatsAppNumber(to);

    const response = await client.messages.create({
      body: text,
      from: formattedFrom,
      to: formattedTo,
    });

    console.log(`✅ [Twilio API] Sent successfully to ${to}. SID: ${response.sid}`);
    return response;
    
  } catch (error) {
    console.error("❌ [Twilio API] Error sending message:", error);
    throw error;
  }
}
