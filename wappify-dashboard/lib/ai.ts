import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generates a merchant-specific AI response using Gemini Pro.
 * Injects the merchant's brand context and product catalog into the prompt.
 */
export async function generateAiResponse(merchantId: string, userMessage: string) {
  try {
    // ── 1. Fetch Merchant Data ────────────────
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        products: {
          where: { isActive: true },
          select: { name: true, price: true, description: true, stock: true },
        },
      },
    });

    if (!merchant) throw new Error("Merchant not found");

    // ── 2. Construct Knowledge Base ───────────
    const productsList = merchant.products
      .map((p) => `- ${p.name}: ₹${Number(p.price)} (${p.description || "No description"}) [Stock: ${p.stock}]`)
      .join("\n");

    const systemPrompt = `
      You are "${merchant.name}'s" helpful WhatsApp AI assistant. 
      Your goal is to help customers find products, answer questions about the store, and provide accurate information.

      --- MERCHANT KNOWLEDGE BASE ---
      STORE PROFILE:
      ${merchant.aiContext || "A professional retail store."}

      AVAILABLE PRODUCTS:
      ${productsList || "No products currently listed."}
      --- END KNOWLEDGE BASE ---

      INSTRUCTIONS:
      1. Be polite, concise, and helpful.
      2. ONLY use the information provided in the Knowledge Base above.
      3. If you don't know the answer, politely ask them to wait for a human representative.
      4. Use emojis sparingly to keep the conversation friendly.
      5. If they ask about prices, always mention the price in ₹ (INR).
      6. Use line breaks to make your response easy to read on WhatsApp.

      Customer says: "${userMessage}"
    `;

    // ── 3. Generate Response ──────────────────
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text().trim();

  } catch (error) {
    console.error("❌ [AI Engine] Error generating response:", error);
    return "I'm sorry, I'm having a bit of trouble thinking right now. A human representative will get back to you shortly! 🙏";
  }
}
