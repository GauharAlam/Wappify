/**
 * Sends a WhatsApp message using the WhatsApp Cloud API.
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
) {
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: text },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`WhatsApp API Error: ${JSON.stringify(data)}`);
    }

    console.log(`✅ [WhatsApp API] Sent successfully to ${to}`);
    return data;
    
  } catch (error) {
    console.error("❌ [WhatsApp API] Error sending message:", error);
    throw error;
  }
}
