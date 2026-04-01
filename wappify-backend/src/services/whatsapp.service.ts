import axios from "axios";

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
// Config
// ─────────────────────────────────────────────

const WHATSAPP_API_BASE = "https://graph.facebook.com/v19.0";

const getWhatsAppConfig = () => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is not set in .env",
    );
  }

  return { phoneNumberId, accessToken };
};

// ─────────────────────────────────────────────
// Core: Send text message
// ─────────────────────────────────────────────

export const sendTextMessage = async (
  to: string,
  message: string,
): Promise<void> => {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();

  const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  console.log(`[WHATSAPP SERVICE] Sending text message to: ${to}`);
  console.log("[WHATSAPP SERVICE] Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "[WHATSAPP SERVICE] Message sent successfully:",
      JSON.stringify(response.data, null, 2),
    );
  } catch (error: any) {
    const errData = error?.response?.data || error?.message || error;
    console.error(
      "[WHATSAPP SERVICE] Failed to send message:",
      JSON.stringify(errData, null, 2),
    );
    throw new Error(`WhatsApp send failed: ${JSON.stringify(errData)}`);
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
