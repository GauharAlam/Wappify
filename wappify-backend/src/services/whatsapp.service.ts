import twilio from "twilio";
import { getTwilioConfig, formatWhatsAppNumber } from "./twilio.service";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CatalogProduct {
  name: string;
  price: number;
  description: string | null;
  stock: number;
}

// ─────────────────────────────────────────────
// Core: Send text message
// ─────────────────────────────────────────────

export const sendTextMessage = async (
  to: string,
  message: string,
): Promise<void> => {
  const merchantId = process.env.MERCHANT_ID;
  if (!merchantId) {
    throw new Error("MERCHANT_ID is not set in .env");
  }

  // Fetch Twilio config securely from DB
  const { accountSid, authToken, whatsappNumber } = await getTwilioConfig(merchantId);

  // Initialize Twilio client
  const client = twilio(accountSid, authToken);

  // Format numbers for Twilio
  const formattedTo = formatWhatsAppNumber(to);
  const formattedFrom = formatWhatsAppNumber(whatsappNumber);

  console.log(`[TWILIO SERVICE] Sending text message to: ${formattedTo}`);

  try {
    const response = await client.messages.create({
      body: message,
      from: formattedFrom,
      to: formattedTo,
    });

    console.log(
      `[TWILIO SERVICE] Message sent successfully! SID: ${response.sid}`
    );
  } catch (error: any) {
    console.error(
      "[TWILIO SERVICE] Failed to send message:",
      error?.message || error
    );
    throw new Error(`Twilio send failed: ${error?.message || "Unknown error"}`);
  }
};

// ─────────────────────────────────────────────
// Greeting — dynamic merchant name
// ─────────────────────────────────────────────

export const sendGreetingMessage = async (
  to: string,
  customerName?: string,
  merchantName: string = "Our Store",
): Promise<void> => {
  const name = customerName ? ` ${customerName}` : "";

  const message =
    `Namaste${name}! 🙏 *${merchantName}* mein aapka swagat hai!\n\n` +
    `Main aapki shopping mein help karne ke liye yahan hoon. Neeche se choose karein:\n\n` +
    `🛍️ *1* — Hamara catalog dekhein\n` +
    `🛒 *2* — Order / Checkout\n` +
    `❓ *3* — Help & FAQ\n\n` +
    `Ya seedha apna sawaal type karein, main Hinglish mein jawab dunga! 😊`;

  await sendTextMessage(to, message);
};

// ─────────────────────────────────────────────
// Catalog — dynamic merchant name + DB products
// ─────────────────────────────────────────────

export const sendCatalogMessage = async (
  to: string,
  products: CatalogProduct[],
  merchantName: string = "Our Store",
): Promise<void> => {
  if (products.length === 0) {
    await sendTextMessage(
      to,
      "Abhi koi product available nahi hai. Thodi der baad try karein! 🙏",
    );
    return;
  }

  const productLines = products
    .map(
      (p, index) =>
        `*${index + 1}. ${p.name}*\n` +
        `💰 Price: ₹${p.price}\n` +
        `📝 ${p.description || "Premium quality product"}\n` +
        `📦 Stock: ${p.stock} units available`,
    )
    .join("\n\n");

  const message =
    `✨ *${merchantName} — Latest Collection* ✨\n\n` +
    `${productLines}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Koi product pasand aaya? 😍\n` +
    `➡️ *"buy [product name]"* likhein order karne ke liye\n` +
    `➡️ Koi sawaal ho toh seedha poochein!`;

  await sendTextMessage(to, message);
};

// ─────────────────────────────────────────────
// Order init message
// ─────────────────────────────────────────────

export const sendOrderInitMessage = async (to: string): Promise<void> => {
  const message =
    `🛒 *Order karna chahte hain? Bilkul sahi choice!*\n\n` +
    `Filhaal aap humse directly order kar sakte hain:\n\n` +
    `1️⃣ Catalog dekhne ke liye *"1"* type karein\n` +
    `2️⃣ Product ka naam aur quantity batayein\n` +
    `3️⃣ Hum aapko payment link bhejenge!\n\n` +
    `Koi help chahiye? Seedha poochein 😊`;

  await sendTextMessage(to, message);
};

// ─────────────────────────────────────────────
// Fallback message
// ─────────────────────────────────────────────

export const sendFallbackMessage = async (to: string): Promise<void> => {
  const message =
    `Oops! Mujhe samajh nahi aaya 😅\n\n` +
    `Aap neeche se ek option choose kar sakte hain:\n\n` +
    `🛍️ *1* — Catalog dekhein\n` +
    `🛒 *2* — Order karein\n` +
    `❓ *3* — Help & FAQ\n\n` +
    `Ya apna sawaal dobara clearly type karein, main zaroor help karunga!`;

  await sendTextMessage(to, message);
};

// ─────────────────────────────────────────────
// Media acknowledgement — for image/video/audio
// ─────────────────────────────────────────────

export const sendMediaAcknowledgement = async (
  to: string,
  mediaType: string,
): Promise<void> => {
  const typeLabels: Record<string, string> = {
    image: "photo 📸",
    video: "video 🎬",
    audio: "audio 🎵",
    document: "document 📄",
    sticker: "sticker",
  };

  const label = typeLabels[mediaType] || "file";

  const message =
    `Thanks for sharing the ${label}! 🙏\n\n` +
    `Abhi hum sirf text messages handle kar sakte hain.\n` +
    `Apna sawaal text mein type karein aur hum turant help karenge! 😊\n\n` +
    `🛍️ *1* type karein catalog dekhne ke liye`;

  await sendTextMessage(to, message);
};
