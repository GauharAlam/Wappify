import { generateAIResponse, getMerchantContextData } from "./gemini.service";
import {
  sendCatalogMessage,
  sendGreetingMessage,
  sendOrderInitMessage,
  sendTextMessage,
  CatalogProduct,
} from "./whatsapp.service";
import {
  findOrCreateContact,
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
import { isWithinBusinessHours } from "../lib/businessHours";

// ─────────────────────────────────────────────
// Chat Message Logger (persists to DB for CRM)
// ─────────────────────────────────────────────

const logMessage = async (
  orgId: string,
  customerWaId: string,
  sender: "customer" | "bot",
  message: string,
  customerName?: string,
) => {
  if (!orgId) return null;

  try {
    // 1. Upsert contact
    const contact = await prisma.contact.upsert({
      where: { orgId_waId: { orgId, waId: customerWaId } },
      update: { name: customerName || undefined },
      create: { orgId, waId: customerWaId, name: customerName || null },
    });

    // 2. Upsert conversation
    const conversation = await prisma.conversation.upsert({
      where: { orgId_contactId: { orgId, contactId: contact.id } },
      update: {
        lastMessageAt: new Date(),
        lastMessagePreview: message.slice(0, 100),
        unreadCount: sender === "customer" ? { increment: 1 } : undefined,
        status: sender === "customer" ? "OPEN" : undefined,
      },
      create: {
        orgId,
        contactId: contact.id,
        status: "OPEN",
        lastMessageAt: new Date(),
        lastMessagePreview: message.slice(0, 100),
        unreadCount: sender === "customer" ? 1 : 0,
      },
    });

    // 3. Create message record
    await prisma.message.create({
      data: {
        orgId,
        conversationId: conversation.id,
        direction: sender === "customer" ? "INBOUND" : "OUTBOUND",
        content: message,
        type: "TEXT",
      },
    });

    return conversation;
  } catch (err: any) {
    console.error("[CHAT LOG] Failed to persist message:", err?.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// Automation Rules Evaluator
// ─────────────────────────────────────────────

const evaluateAutomationRules = async (
  orgId: string,
  messageText: string,
  isFirstMessage: boolean,
  isOutsideHours: boolean,
  isMedia: boolean
) => {
  const rules = await prisma.automationRule.findMany({
    where: { orgId, isActive: true },
    orderBy: { priority: "asc" },
  });

  const normalizedText = messageText.toLowerCase().trim();

  for (const rule of rules) {
    if (rule.trigger === "OUTSIDE_HOURS" && isOutsideHours) return rule;
    if (rule.trigger === "FIRST_MESSAGE" && isFirstMessage) return rule;
    if (rule.trigger === "MEDIA_RECEIVED" && isMedia) return rule;
    if (rule.trigger === "ALL_MESSAGES") return rule;

    if (rule.trigger === "KEYWORD") {
      const matchFound = rule.keywords.some((kw) => {
        const lowerKw = kw.toLowerCase();
        if (rule.matchMode === "EXACT") return normalizedText === lowerKw;
        if (rule.matchMode === "STARTS_WITH") return normalizedText.startsWith(lowerKw);
        return normalizedText.includes(lowerKw); // CONTAINS
      });
      if (matchFound) return rule;
    }
  }

  return null;
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
const getActiveProducts = async (orgId: string): Promise<DBProduct[]> => {

  const products = await prisma.product.findMany({
    where: {
      ...(orgId ? { orgId } : {}),
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
const getAllActiveProducts = async (orgId: string): Promise<DBProduct[]> => {

  const products = await prisma.product.findMany({
    where: {
      ...(orgId ? { orgId } : {}),
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
const getMerchantName = async (orgId: string): Promise<string> => {
  if (!orgId) return "Our Store";

  const merchant = await prisma.organization.findUnique({
    where: { id: orgId },
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

const getPaymentConfig = async (orgId: string): Promise<PaymentConfig> => {
  if (!orgId) return { mode: "none", merchantName: "Our Store" };

  const merchant = await prisma.organization.findUnique({
    where: { id: orgId },
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
  orgId: string,
  from: string,
  productQuery: string,
  customerName?: string,
): Promise<void> => {
  console.log(
    `[ROUTER] Buy request — query: "${productQuery}" | from: ${from}`,
  );

  // ── Step 1: Find product from DB ────────────
  const allProducts = await getAllActiveProducts(orgId);
  const matchedProduct = findMatchingProduct(productQuery, allProducts);

  if (!matchedProduct) {
    console.warn(
      `[ROUTER] No product match found for query: "${productQuery}"`,
    );
    await sendTextMessage(
      orgId,
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
      orgId,
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
  if (!orgId) {
    console.error("[ROUTER] ORG_ID is not set — cannot create order");
    await sendTextMessage(
      orgId,
      from,
      "😔 Kuch technical problem aayi. Please thodi der mein dobara try karein!",
    );
    return;
  }

  // ── Step 4: Detect payment method ───────────
  const paymentConfig = await getPaymentConfig(orgId);

  if (paymentConfig.mode === "none") {
    console.error("[ROUTER] No payment method configured — cannot create order");
    await sendTextMessage(
      orgId,
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
    // ── Step 5: Upsert Contact in DB ──────────
    const customer = await findOrCreateContact(orgId, from, customerName);

    // ── Step 6: Create PENDING Order in DB ─────
    const order = await createPendingOrder({
      orgId,
      contactId: customer.id,
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

      await sendTextMessage(orgId, from, message);
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

      await sendTextMessage(orgId, from, message);
      console.log(`[ROUTER] ✅ UPI link sent to ${from} for order #${shortOrderId}`);
    }

  } catch (error: any) {
    console.error("[ROUTER] ❌ Buy flow failed:");
    console.error("[ROUTER] Message:", error?.message || "Unknown error");
    console.error("[ROUTER] Stack  :", error?.stack || "No stack");

    await sendTextMessage(
      orgId,
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
  orgId: string,
  from: string,
  messageText: string,
  customerName?: string,
  isMedia: boolean = false
): Promise<void> => {
  const trimmedText = messageText.trim();

  if (!trimmedText && !isMedia) {
    console.warn(`[ROUTER] Empty message received from ${from} — ignoring`);
    return;
  }

  // Fetch org details for business hours
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, businessHoursSchedule: true, timezone: true }
  });

  const merchantName = org?.name || "Our Store";

  // Check if first message
  const previousMessageCount = await prisma.message.count({
    where: { orgId, conversation: { contact: { waId: from } }, direction: "INBOUND" }
  });
  const isFirstMessage = previousMessageCount === 0;

  // Persist customer message (now awaitable to get conversation state)
  const conversation = await logMessage(
    orgId,
    from,
    "customer",
    isMedia ? "[Media Message]" : trimmedText,
    customerName
  );

  if (conversation?.isEscalated) {
    console.log(`[ROUTER] Conversation ${conversation.id} is escalated to human. Bot skipping reply.`);
    return;
  }

  console.log("────────────────────────────────────────");
  console.log(`[ROUTER] From       : ${from}`);
  console.log(`[ROUTER] Customer   : ${customerName || "Unknown"}`);
  console.log(`[ROUTER] Message    : "${isMedia ? "[Media Message]" : trimmedText}"`);
  console.log("────────────────────────────────────────");

  // Check business hours
  const isOutsideHours = !isWithinBusinessHours(org?.businessHoursSchedule, org?.timezone);

  // Evaluate rules
  const matchedRule = await evaluateAutomationRules(
    orgId,
    trimmedText,
    isFirstMessage,
    isOutsideHours,
    isMedia
  );

  if (!matchedRule) {
    console.log("[ROUTER] No rule matched, falling back to Gemini AI");
    if (!isMedia) {
      await handleForwardToAI(orgId, from, trimmedText);
    }
    return;
  }

  console.log(`[ROUTER] Matched Rule: ${matchedRule.name} (Action: ${matchedRule.action})`);

  // Apply Tag if configured
  if (matchedRule.tagId && conversation) {
    await prisma.conversationTag.upsert({
      where: {
        conversationId_tagId: {
          conversationId: conversation.id,
          tagId: matchedRule.tagId
        }
      },
      update: {},
      create: {
        conversationId: conversation.id,
        tagId: matchedRule.tagId
      }
    });
  }

  // Execute Action
  switch (matchedRule.action) {
    case "SEND_TEXT":
      if (matchedRule.responseText) {
        logMessage(orgId, from, "bot", matchedRule.responseText);
        await sendTextMessage(orgId, from, matchedRule.responseText);
      }
      break;
    case "SEND_GREETING":
      clearConversation(from);
      const greetingMsg = `Namaste${customerName ? " " + customerName : ""}! 🙏 Welcome to ${merchantName}!\n\nHum aapki kya madad kar sakte hai?\n\n1️⃣ Product Catalog dekhein\n2️⃣ Order place karein\n3️⃣ Koi bhi sawaal poochein — AI jawab dega!`;
      logMessage(orgId, from, "bot", greetingMsg);
      await sendGreetingMessage(orgId, from, customerName, merchantName);
      break;
    case "SEND_CATALOG":
      const activeProducts = await getActiveProducts(orgId);
      const catalogProducts: CatalogProduct[] = activeProducts.map((p) => ({
        name: p.name,
        price: p.price,
        description: p.description,
        stock: p.stock,
      }));
      if (catalogProducts.length === 0) {
        const noProductMsg = "😔 Abhi koi product available nahi hai. Thodi der baad dobara try karein!";
        logMessage(orgId, from, "bot", noProductMsg);
        await sendTextMessage(orgId, from, noProductMsg);
      } else {
        const catalogMsg = `📦 ${merchantName} Catalog:\n` + catalogProducts.map((p, i) => `${i+1}. ${p.name} — ₹${p.price}`).join("\n");
        logMessage(orgId, from, "bot", catalogMsg);
        await sendCatalogMessage(orgId, from, catalogProducts, merchantName);
      }
      break;
    case "FORWARD_TO_AI":
      if (!isMedia) {
        const lower = trimmedText.toLowerCase();
        const buyCommandMatch = lower.match(/^buy\s+(.+)$/i);
        if (buyCommandMatch) {
          const productQuery = trimmedText.slice(4).trim();
          await handleBuyRequest(orgId, from, productQuery, customerName);
        } else if (trimmedText === "2" || trimmedText.includes("order") || trimmedText.includes("buy")) {
          await sendOrderInitMessage(orgId, from);
        } else {
          await handleForwardToAI(orgId, from, trimmedText);
        }
      }
      break;
    case "ESCALATE_TO_HUMAN":
      if (conversation) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { isEscalated: true }
        });
        const escalateMsg = matchedRule.responseText || "Thank you. An agent will be with you shortly.";
        logMessage(orgId, from, "bot", escalateMsg);
        await sendTextMessage(orgId, from, escalateMsg);
      }
      break;
    case "SET_TAG":
      if (matchedRule.responseText) {
        logMessage(orgId, from, "bot", matchedRule.responseText);
        await sendTextMessage(orgId, from, matchedRule.responseText);
      }
      break;
  }
};

const handleForwardToAI = async (orgId: string, from: string, trimmedText: string) => {
  const history = getConversationHistory(from);
  addToConversation(from, "user", trimmedText);
  const aiResponse = await generateAIResponse(orgId, trimmedText, history);
  addToConversation(from, "model", aiResponse);
  logMessage(orgId, from, "bot", aiResponse);
  await sendTextMessage(orgId, from, aiResponse);
};
