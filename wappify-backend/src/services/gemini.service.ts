import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { prisma } from "../lib/prisma";

// ─────────────────────────────────────────────
// Gemini client singleton
// ─────────────────────────────────────────────

const getGeminiClient = (): GoogleGenerativeAI => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  return new GoogleGenerativeAI(apiKey);
};

// ─────────────────────────────────────────────
// Dynamic Merchant Context Builder
// Fetches merchant data + live product catalog
// from the DB to construct the system prompt.
// ─────────────────────────────────────────────

interface MerchantContextData {
  merchantName: string;
  aiContext: string | null;
  products: Array<{
    name: string;
    price: number;
    description: string | null;
    stock: number;
  }>;
}

const buildMerchantContext = (data: MerchantContextData): string => {
  const { merchantName, aiContext, products } = data;

  const productList =
    products.length > 0
      ? products
          .map(
            (p) =>
              `- ${p.name} | Price: ₹${p.price} | ${p.description || "No description"} | Stock: ${p.stock} units`,
          )
          .join("\n")
      : "No products currently available in the catalog.";

  // If the merchant has custom AI context, use it. Otherwise, use the default.
  const customContext = aiContext?.trim()
    ? `\n\nADDITIONAL MERCHANT INSTRUCTIONS:\n${aiContext}`
    : "";

  return `
You are a helpful, friendly shopping assistant for a D2C brand called "${merchantName}".
Your job is to help customers browse products, answer questions about sizing, delivery, returns, and payments.

LANGUAGE STYLE:
- Communicate in a warm, conversational Hinglish (natural mix of Hindi and English).
- Keep responses short and punchy — max 3-4 lines per reply.
- Use emojis sparingly to keep it friendly, not overwhelming.
- Never sound robotic or overly formal.

WHAT YOU CAN DO:
- Answer questions about the product catalog below.
- Help customers choose the right size or product.
- Explain store policies clearly.
- Guide customers toward making a purchase.

WHAT YOU MUST NOT DO:
- Never make up product details, prices, or policies not listed below.
- Never promise delivery dates or discounts you are not sure about.
- Never discuss topics unrelated to shopping at ${merchantName}.

CURRENT PRODUCT CATALOG:
${productList}

STORE POLICIES:
- Delivery: Free shipping on orders above ₹999, otherwise ₹99 flat shipping charge.
- Returns: 7-day hassle-free return policy. Item must be unused and in original packaging.
- Payment: UPI, Debit/Credit Cards, Net Banking via Razorpay. COD is not available.
- Delivery Time: 3-5 business days across India.
- Exchanges: Size exchanges allowed within 7 days of delivery.
${customContext}

If a customer wants to buy something, guide them to type "buy [product name]" or "2" to proceed to checkout.
If a customer wants to see the catalog, remind them to type "1".
Always end your reply with a gentle nudge to help them take the next step.
`.trim();
};

// ─────────────────────────────────────────────
// Fetch merchant + products for context
// ─────────────────────────────────────────────

export const getMerchantContextData = async (): Promise<MerchantContextData> => {
  const merchantId = process.env.MERCHANT_ID;

  if (!merchantId) {
    return {
      merchantName: "Our Store",
      aiContext: null,
      products: [],
    };
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      name: true,
      aiContext: true,
      products: {
        where: { isActive: true },
        select: {
          name: true,
          price: true,
          description: true,
          stock: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!merchant) {
    return {
      merchantName: "Our Store",
      aiContext: null,
      products: [],
    };
  }

  return {
    merchantName: merchant.name,
    aiContext: merchant.aiContext,
    products: merchant.products.map((p) => ({
      name: p.name,
      price: Number(p.price),
      description: p.description,
      stock: p.stock,
    })),
  };
};

// ─────────────────────────────────────────────
// Generate AI Response
// ─────────────────────────────────────────────

export const generateAIResponse = async (
  userMessage: string,
  conversationHistory: Content[] = [],
): Promise<string> => {
  try {
    const genAI = getGeminiClient();

    // Build dynamic system instruction from DB
    const contextData = await getMerchantContextData();
    const systemInstruction = buildMerchantContext(contextData);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
      generationConfig: {
        maxOutputTokens: 350,
        temperature: 0.75,
        topP: 0.9,
      },
    });

    console.log("[GEMINI] Sending message to Gemini Flash:", userMessage);
    console.log(
      "[GEMINI] Conversation history length:",
      conversationHistory.length,
    );
    console.log(
      "[GEMINI] Merchant context:",
      contextData.merchantName,
      `(${contextData.products.length} products)`,
    );

    const chat = model.startChat({
      history: conversationHistory,
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim() === "") {
      console.warn(
        "[GEMINI] Empty response received from Gemini, using fallback",
      );
      return "Mujhe samajh nahi aaya! 😅 Kya aap dobara pooch sakte hain? Aap *1* type karein catalog dekhne ke liye ya apna sawaal aur clearly poochein!";
    }

    console.log("[GEMINI] Response received successfully:", text);
    return text;
  } catch (error: any) {
    console.error("[GEMINI ERROR] Failed to generate AI response");
    console.error("[GEMINI ERROR] Message:", error?.message || "Unknown error");
    console.error("[GEMINI ERROR] Stack:", error?.stack || "No stack trace");

    if (error?.message?.includes("API_KEY")) {
      throw new Error(
        "Invalid Gemini API Key. Please check GEMINI_API_KEY in your .env file.",
      );
    }

    if (error?.message?.includes("quota") || error?.message?.includes("429")) {
      return "Abhi server busy hai! 🙏 Thodi der baad try karein. Meanwhile *1* type karein catalog dekhne ke liye.";
    }

    return "Kuch technical issue aa gaya! 😅 Thodi der mein dobara try karein ya *1* type karein catalog dekhne ke liye.";
  }
};
