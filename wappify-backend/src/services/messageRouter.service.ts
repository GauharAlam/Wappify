import { generateAIResponse, getMerchantContextData } from "./gemini.service";
import {
  sendCatalogMessage,
  sendGreetingMessage,
  sendOrderInitMessage,
  sendTextMessage,
  CatalogProduct,
} from "./whatsapp.service";
import {
  findOrCreateCustomer,
  createPendingOrder,
  updateOrderWithRazorpayLink,
} from "./order.service";
import { createPaymentLink } from "./razorpay.service";
import { generateUpiPaymentLink } from "./upi.service";
import {
  getConversationHistory,
  addToConversation,
  clearConversation,
} from "./conversationStore";
import { prisma } from "../lib/prisma";

// ─────────────────────────────────────────────
// Chat Message Logger (persists to DB for CRM)
// ─────────────────────────────────────────────

const logChatMessage = (
  customerWaId: string,
  sender: "customer" | "bot",
  message: string,
): void => {
  const merchantId = process.env.MERCHANT_ID;
  if (!merchantId) return;

  // Fire-and-forget — don't block the message flow
  prisma.chatMessage
    .create({
      data: { merchantId, customerWaId, sender, message },
    })
    .catch((err: any) => {
      console.error("[CHAT LOG] Failed to persist message:", err?.message);
    });
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type MessageType =
  | "GREETING"
  | "CATALOG_REQUEST"
  | "ORDER_REQUEST"
  | "AI_QUERY";

// ─────────────────────────────────────────────
// Classifier — pure function, no side effects
// ─────────────────────────────────────────────

const classifyMessage = (text: string): MessageType => {
  const lower = text.toLowerCase().trim();

  // ── Greeting patterns ──────────────────────
  const greetingPatterns = [
    "hi",
    "hello",
    "hey",
    "hlo",
    "hii",
    "hiii",
    "namaste",
    "namaskar",
    "start",
    "hai",
    "hy",
    "sup",
    "good morning",
    "good evening",
    "good afternoon",
  ];
  if (greetingPatterns.some((g) => lower === g || lower.startsWith(g + " "))) {
    return "GREETING";
  }

  // ── Catalog request patterns ───────────────
  const catalogPatterns = [
    "1",
    "catalog",
    "catalogue",
    "products",
    "collection",
    "dikhao",
    "dekho",
    "show",
    "list",
    "kya hai",
    "kya kya hai",
    "saman",
    "items",
    "product dikhao",
    "products dikhao",
    "product list",
  ];
  if (catalogPatterns.some((k) => lower === k || lower.includes(k))) {
    return "CATALOG_REQUEST";
  }

  // ── Order / buy patterns ───────────────────
  const orderPatterns = [
    "2",
    "buy",
    "order",
    "kharidna",
    "kharidni",
    "chahiye",
    "lena hai",
    "checkout",
    "purchase",
    "book",
    "add to cart",
    "cart",
    "place order",
  ];
  if (orderPatterns.some((k) => lower === k || lower.includes(k))) {
    return "ORDER_REQUEST";
  }

  // ── Everything else → Gemini AI ───────────
  return "AI_QUERY";
};

// ─────────────────────────────────────────────
// DB Product Fetchers
// ─────────────────────────────────────────────

interface DBProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
}

/**
 * Fetches all active products with stock > 0 from the database.
 */
const getActiveProducts = async (): Promise<DBProduct[]> => {
  const merchantId = process.env.MERCHANT_ID;

  const products = await prisma.product.findMany({
    where: {
      ...(merchantId ? { merchantId } : {}),
      isActive: true,
      stock: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      stock: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    description: p.description,
    stock: p.stock,
  }));
};

/**
 * Fetches ALL active products (including out-of-stock) for matching.
 */
const getAllActiveProducts = async (): Promise<DBProduct[]> => {
  const merchantId = process.env.MERCHANT_ID;

  const products = await prisma.product.findMany({
    where: {
      ...(merchantId ? { merchantId } : {}),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      stock: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    description: p.description,
    stock: p.stock,
  }));
};

/**
 * Fetches the merchant name from the database.
 */
const getMerchantName = async (): Promise<string> => {
  const merchantId = process.env.MERCHANT_ID;
  if (!merchantId) return "Our Store";

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { name: true },
  });

  return merchant?.name || "Our Store";
};

// ─────────────────────────────────────────────
// Payment Configuration Fetcher
// Determines which payment method to use:
// 1. Razorpay (if keys are configured)
// 2. UPI Direct (if upiId is set — zero cost)
// ─────────────────────────────────────────────

interface PaymentConfig {
  mode: "razorpay" | "upi" | "none";
  upiId?: string;
  merchantName: string;
}

const getPaymentConfig = async (): Promise<PaymentConfig> => {
  const merchantId = process.env.MERCHANT_ID;
  if (!merchantId) return { mode: "none", merchantName: "Our Store" };

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      name: true,
      razorpayKeyId: true,
      razorpayKeySecret: true,
      upiId: true,
    },
  });

  if (!merchant) return { mode: "none", merchantName: "Our Store" };

  // Prefer Razorpay if fully configured
  if (merchant.razorpayKeyId && merchant.razorpayKeySecret) {
    return { mode: "razorpay", merchantName: merchant.name };
  }

  // Fallback to UPI deep links (zero cost)
  if (merchant.upiId) {
    return { mode: "upi", upiId: merchant.upiId, merchantName: merchant.name };
  }

  return { mode: "none", merchantName: merchant.name };
};

// ─────────────────────────────────────────────
// Product Matcher (DB-driven)
// Fuzzy-matches a query string against the live
// catalog using substring matching (case-insensitive).
// ─────────────────────────────────────────────

const findMatchingProduct = (
  query: string,
  products: DBProduct[],
): DBProduct | null => {
  const normalizedQuery = query.toLowerCase().trim();

  // First pass: exact name match
  const exactMatch = products.find(
    (p) => p.name.toLowerCase() === normalizedQuery,
  );
  if (exactMatch) return exactMatch;

  // Second pass: product name contains the query
  const containsMatch = products.find((p) =>
    p.name.toLowerCase().includes(normalizedQuery),
  );
  if (containsMatch) return containsMatch;

  // Third pass: query contains the product name (or a significant word from it)
  const reverseMatch = products.find((p) => {
    const words = p.name.toLowerCase().split(" ");
    // Match if query includes any word from product name that is > 3 chars
    return words.some(
      (word) => word.length > 3 && normalizedQuery.includes(word),
    );
  });

  return reverseMatch || null;
};

// ─────────────────────────────────────────────
// Buy Flow Handler
// Orchestrates the full purchase journey:
// Customer → Product Lookup → DB Order → Razorpay Link → WhatsApp message
// ─────────────────────────────────────────────

const handleBuyRequest = async (
  from: string,
  productQuery: string,
  customerName?: string,
): Promise<void> => {
  console.log(
    `[ROUTER] Buy request — query: "${productQuery}" | from: ${from}`,
  );

  // ── Step 1: Find product from DB ────────────
  const allProducts = await getAllActiveProducts();
  const matchedProduct = findMatchingProduct(productQuery, allProducts);

  if (!matchedProduct) {
    console.warn(
      `[ROUTER] No product match found for query: "${productQuery}"`,
    );
    await sendTextMessage(
      from,
      [
        `😅 Sorry! "*${productQuery}*" naam ka koi product nahi mila humari catalog mein.`,
        ``,
        `👇 Poori catalog dekhne ke liye *1* type karein aur sahi product ka naam bhejein!`,
      ].join("\n"),
    );
    return;
  }

  console.log(
    `[ROUTER] Matched product: "${matchedProduct.name}" (id: ${matchedProduct.id})`,
  );

  // ── Step 2: Check stock ─────────────────────
  if (matchedProduct.stock <= 0) {
    await sendTextMessage(
      from,
      [
        `😔 Uh oh! *${matchedProduct.name}* abhi out of stock hai.`,
        ``,
        `*1* type karein doosre available products dekhne ke liye!`,
      ].join("\n"),
    );
    return;
  }

  // ── Step 3: Check merchant config ──────────
  const merchantId = process.env.MERCHANT_ID;
  if (!merchantId) {
    console.error("[ROUTER] MERCHANT_ID is not set — cannot create order");
    await sendTextMessage(
      from,
      "😔 Kuch technical problem aayi. Please thodi der mein dobara try karein!",
    );
    return;
  }

  // ── Step 4: Detect payment method ───────────
  const paymentConfig = await getPaymentConfig();

  if (paymentConfig.mode === "none") {
    console.error("[ROUTER] No payment method configured — cannot create order");
    await sendTextMessage(
      from,
      [
        `😔 Payment abhi setup nahi hua dukaan mein.`,
        ``,
        `Kuch der mein try karein — hum jaldi fix kar denge! 🙏`,
      ].join("\n"),
    );
    return;
  }

  try {
    // ── Step 5: Upsert Customer in DB ──────────
    const customer = await findOrCreateCustomer(from, customerName);

    // ── Step 6: Create PENDING Order in DB ─────
    const order = await createPendingOrder({
      merchantId,
      customerId: customer.id,
      productId: matchedProduct.id,
      quantity: 1,
      pricePerUnit: matchedProduct.price,
    });

    const shortOrderId = order.id.slice(0, 8).toUpperCase();

    // ─────────────────────────────────────────
    // Payment Method: RAZORPAY (Gateway)
    // Generates a hosted payment link with
    // automated webhook confirmation.
    // ─────────────────────────────────────────
    if (paymentConfig.mode === "razorpay") {
      console.log(`[ROUTER] Using RAZORPAY for order #${shortOrderId}`);

      const paymentLink = await createPaymentLink({
        amountInRupees: matchedProduct.price,
        orderId: order.id,
        customerPhone: from,
        customerName: customerName,
        description: `${paymentConfig.merchantName} — ${matchedProduct.name}`,
      });

      await updateOrderWithRazorpayLink(order.id, paymentLink.id);

      const message = [
        `🛒 *Order Summary*`,
        ``,
        `📦 *${matchedProduct.name}*`,
        `💰 Price    : ₹${matchedProduct.price}`,
        `🔢 Quantity : 1`,
        `📋 Order ID : #${shortOrderId}`,
        ``,
        `✅ *Payment link ready hai!* Neeche tap karein:`,
        ``,
        `👉 ${paymentLink.short_url}`,
        ``,
        `⏳ Yeh link *24 ghante* mein expire ho jayega.`,
        ``,
        `Payment hone ke baad aapko confirmation message milega. 🎉`,
        `Koi issue ho toh seedha yahan message karein! 😊`,
      ].join("\n");

      await sendTextMessage(from, message);
      console.log(`[ROUTER] ✅ Razorpay link sent to ${from} for order #${shortOrderId}`);
    }

    // ─────────────────────────────────────────
    // Payment Method: UPI DIRECT (Zero Cost)
    // Generates a UPI deep link — customer pays
    // directly via any UPI app. No gateway fees.
    // ─────────────────────────────────────────
    if (paymentConfig.mode === "upi") {
      console.log(`[ROUTER] Using UPI DIRECT for order #${shortOrderId}`);

      const upiLink = generateUpiPaymentLink({
        upiId: paymentConfig.upiId!,
        merchantName: paymentConfig.merchantName,
        amountInRupees: matchedProduct.price,
        orderId: order.id,
        productName: matchedProduct.name,
      });

      const message = [
        `🛒 *Order Summary*`,
        ``,
        `📦 *${matchedProduct.name}*`,
        `💰 Price    : ₹${matchedProduct.price}`,
        `🔢 Quantity : 1`,
        `📋 Order ID : #${shortOrderId}`,
        ``,
        `💳 *UPI se pay karein:*`,
        ``,
        `📲 UPI ID: *${paymentConfig.upiId}*`,
        `💰 Amount: *₹${matchedProduct.price}*`,
        ``,
        `👉 *GPay / PhonePe / Paytm* koi bhi app se pay karein:`,
        `${upiLink.deepLink}`,
        ``,
        `✅ Payment ke baad apna *UTR number / screenshot* yahan bhejein confirmaton ke liye.`,
        ``,
        `Koi issue ho toh seedha yahan message karein! 😊`,
      ].join("\n");

      await sendTextMessage(from, message);
      console.log(`[ROUTER] ✅ UPI link sent to ${from} for order #${shortOrderId}`);
    }

  } catch (error: any) {
    console.error("[ROUTER] ❌ Buy flow failed:");
    console.error("[ROUTER] Message:", error?.message || "Unknown error");
    console.error("[ROUTER] Stack  :", error?.stack || "No stack");

    await sendTextMessage(
      from,
      [
        `😔 Order process mein kuch problem aayi!`,
        ``,
        `Hum is par kaam kar rahe hain. Please *thodi der baad dobara try karein* ya`,
        `is number par seedha message karein.`,
      ].join("\n"),
    );
  }
};

// ─────────────────────────────────────────────
// Router — main dispatcher
// ─────────────────────────────────────────────

export const routeMessage = async (
  from: string,
  messageText: string,
  customerName?: string,
): Promise<void> => {
  const trimmedText = messageText.trim();

  if (!trimmedText) {
    console.warn(`[ROUTER] Empty message received from ${from} — ignoring`);
    return;
  }

  const messageType = classifyMessage(trimmedText);

  console.log("────────────────────────────────────────");
  console.log(`[ROUTER] From       : ${from}`);
  console.log(`[ROUTER] Customer   : ${customerName || "Unknown"}`);
  console.log(`[ROUTER] Message    : "${trimmedText}"`);
  console.log(`[ROUTER] Classified : ${messageType}`);
  console.log("────────────────────────────────────────");

  // Fetch merchant name once for this request
  const merchantName = await getMerchantName();

  // ── Persist customer message to DB (CRM) ────
  logChatMessage(from, "customer", trimmedText);

  switch (messageType) {
    // ── 1. Greeting ─────────────────────────
    case "GREETING": {
      console.log("[ROUTER] → Handler: GREETING");
      // Clear conversation history on greeting (new session)
      clearConversation(from);
      const greetingMsg = `Namaste${customerName ? " " + customerName : ""}! 🙏 Welcome to ${merchantName}!\n\nHum aapki kya madad kar sakte hai?\n\n1️⃣ Product Catalog dekhein\n2️⃣ Order place karein\n3️⃣ Koi bhi sawaal poochein — AI jawab dega!`;
      logChatMessage(from, "bot", greetingMsg);
      await sendGreetingMessage(from, customerName, merchantName);
      break;
    }

    // ── 2. Catalog ──────────────────────────
    case "CATALOG_REQUEST": {
      console.log("[ROUTER] → Handler: CATALOG_REQUEST");
      const activeProducts = await getActiveProducts();
      const catalogProducts: CatalogProduct[] = activeProducts.map((p) => ({
        name: p.name,
        price: p.price,
        description: p.description,
        stock: p.stock,
      }));

      if (catalogProducts.length === 0) {
        const noProductMsg = "😔 Abhi koi product available nahi hai. Thodi der baad dobara try karein!";
        logChatMessage(from, "bot", noProductMsg);
        await sendTextMessage(from, noProductMsg);
      } else {
        const catalogMsg = `📦 ${merchantName} Catalog:\n` + catalogProducts.map((p, i) => `${i+1}. ${p.name} — ₹${p.price}`).join("\n");
        logChatMessage(from, "bot", catalogMsg);
        await sendCatalogMessage(from, catalogProducts, merchantName);
      }
      break;
    }

    // ── 3. Order / Buy ───────────────────────
    case "ORDER_REQUEST": {
      console.log("[ROUTER] → Handler: ORDER_REQUEST");

      const lower = trimmedText.toLowerCase();

      // Check if this is a specific "buy [product name]" command
      const buyCommandMatch = lower.match(/^buy\s+(.+)$/i);

      if (buyCommandMatch) {
        // e.g. "buy Classic Cotton Tee" → productQuery = "Classic Cotton Tee"
        const productQuery = trimmedText.slice(4).trim();
        await handleBuyRequest(from, productQuery, customerName);
      } else {
        // Generic order intent — show menu with instructions
        console.log("[ROUTER] Generic order intent — showing order init menu");
        await sendOrderInitMessage(from);
      }
      break;
    }

    // ── 4. AI Query (Gemini) ────────────────
    case "AI_QUERY": {
      console.log("[ROUTER] → Handler: AI_QUERY (Gemini 1.5 Flash)");

      // Get conversation history for this customer
      const history = getConversationHistory(from);

      // Store user message in conversation history
      addToConversation(from, "user", trimmedText);

      // Generate AI response with context
      const aiResponse = await generateAIResponse(trimmedText, history);

      // Store AI response in conversation history
      addToConversation(from, "model", aiResponse);

      // Persist bot response to DB
      logChatMessage(from, "bot", aiResponse);

      await sendTextMessage(from, aiResponse);
      break;
    }

    // ── Fallback ────────────────────────────
    default: {
      console.warn(
        "[ROUTER] Unknown classification — falling back to Gemini AI",
      );
      const history = getConversationHistory(from);
      addToConversation(from, "user", trimmedText);

      const fallbackResponse = await generateAIResponse(trimmedText, history);

      addToConversation(from, "model", fallbackResponse);
      logChatMessage(from, "bot", fallbackResponse);
      await sendTextMessage(from, fallbackResponse);
      break;
    }
  }
};
