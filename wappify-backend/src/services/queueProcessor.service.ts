import { prisma } from "../lib/prisma";
import { routeMessage } from "./messageRouter.service";
import { sendMediaAcknowledgement, sendTextMessage } from "./whatsapp.service";

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[Unable to stringify payload]";
  }
};

// ─────────────────────────────────────────────
// Store-code routing map (in-memory cache)
// Maps customer wa_id → merchantId after their
// first message contains a store code.
// ─────────────────────────────────────────────

const customerMerchantMap = new Map<string, string>();

/**
 * Generates the shareable WhatsApp link for a merchant.
 * Customers click this link and auto-send the store code.
 */
export const getShareableLink = (storeCode: string): string => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  // The wa.me link uses the actual phone number, not the ID.
  // In production, this should be the actual WhatsApp Business phone number.
  const waNumber = process.env.WHATSAPP_BUSINESS_NUMBER || phoneNumberId;
  return `https://wa.me/${waNumber}?text=STORE-${storeCode}`;
};

// ─────────────────────────────────────────────
// Parse Meta Cloud API webhook payload
// ─────────────────────────────────────────────

interface ParsedMetaMessage {
  from: string;        // Customer's WhatsApp number (e.g. "919876543210")
  messageId: string;   // Meta message ID (wamid.xxx)
  customerName?: string;
  messageType: string; // "text", "image", "video", "audio", "document", "sticker", etc.
  textBody?: string;   // Only present for type "text"
  phoneNumberId: string; // The platform's phone number ID that received the message
}

const parseMetaPayload = (payload: any): ParsedMetaMessage | null => {
  try {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return null;

    // Status updates (delivered, read, etc.) — skip
    if (value.statuses && !value.messages) {
      return null;
    }

    const message = value.messages?.[0];
    if (!message) return null;

    const contact = value.contacts?.[0];

    return {
      from: message.from,
      messageId: message.id || "",
      customerName: contact?.profile?.name || undefined,
      messageType: message.type || "text",
      textBody: message.text?.body || undefined,
      phoneNumberId: value.metadata?.phone_number_id || "",
    };
  } catch (err) {
    console.error("[QUEUE PROCESSOR] Failed to parse Meta payload:", err);
    return null;
  }
};

// ─────────────────────────────────────────────
// Store-code detection & merchant lookup
// ─────────────────────────────────────────────

const STORE_CODE_REGEX = /^STORE[-_]?(\w+)$/i;

/**
 * Attempts to find the merchant for a given customer message.
 *
 * Priority:
 * 1. Check if the message text starts with "STORE-XXXX" → look up merchant by storeCode
 * 2. Check the in-memory cache (customer already routed before)
 * 3. Check the DB for any existing ChatMessage from this customer → derive merchantId
 * 4. If only one merchant exists in the system, default to that
 */
const resolveMerchant = async (
  from: string,
  textBody?: string,
): Promise<{ merchantId: string; isNewStoreLink: boolean; textOverride?: string } | null> => {

  // ── 1. Explicit store code in message ──────
  if (textBody) {
    const match = textBody.trim().match(STORE_CODE_REGEX);
    if (match) {
      const code = match[1].toUpperCase();
      const merchant = await prisma.merchant.findUnique({
        where: { storeCode: code },
        select: { id: true },
      });

      if (merchant) {
        customerMerchantMap.set(from, merchant.id);
        console.log(`[QUEUE PROCESSOR] Store code "${code}" → merchant ${merchant.id}`);
        return { merchantId: merchant.id, isNewStoreLink: true };
      } else {
        console.warn(`[QUEUE PROCESSOR] Unknown store code: "${code}"`);
        return null;
      }
    }
  }

  // ── 2. In-memory cache ─────────────────────
  const cachedMerchantId = customerMerchantMap.get(from);
  if (cachedMerchantId) {
    return { merchantId: cachedMerchantId, isNewStoreLink: false };
  }

  // ── 3. Previous chat history in DB ─────────
  const previousChat = await prisma.chatMessage.findFirst({
    where: { customerWaId: from },
    orderBy: { createdAt: "desc" },
    select: { merchantId: true },
  });

  if (previousChat) {
    customerMerchantMap.set(from, previousChat.merchantId);
    return { merchantId: previousChat.merchantId, isNewStoreLink: false };
  }

  // ── 4. Single-merchant fallback ────────────
  const merchantCount = await prisma.merchant.count();
  if (merchantCount === 1) {
    const merchant = await prisma.merchant.findFirst({ select: { id: true } });
    if (merchant) {
      customerMerchantMap.set(from, merchant.id);
      return { merchantId: merchant.id, isNewStoreLink: false };
    }
  }

  return null;
};

// ─────────────────────────────────────────────
// Process a single WebhookEvent
// ─────────────────────────────────────────────

async function processJob(jobId: string, payload: any) {
  const parsed = parseMetaPayload(payload);

  if (!parsed) {
    // Status update or unparseable — silently skip
    return;
  }

  const { from, messageId, customerName, messageType, textBody } = parsed;

  if (!from) return;

  console.log(`[QUEUE PROCESSOR] Processing message ${messageId} from ${from}`);

  // ── Resolve merchant via store-code routing ──
  const resolution = await resolveMerchant(from, textBody);

  if (!resolution) {
    console.warn(
      `[QUEUE PROCESSOR] Could not resolve merchant for ${from}. Message: "${textBody || "(media)"}"`,
    );

    // Send a helper message to unrouted customers
    try {
      const { sendMetaTextMessage } = await import("./metaWhatsapp.service");
      await sendMetaTextMessage(
        from,
        "👋 Welcome to Wappify!\n\nIt looks like you reached us without a store link. Please ask the merchant for their WhatsApp store link to get started. 🙏",
      );
    } catch (e) {
      console.error("[QUEUE PROCESSOR] Failed to send unrouted-customer message:", e);
    }
    return;
  }

  const { merchantId, isNewStoreLink } = resolution;

  // If this was a store-code message, treat it as a greeting instead
  if (isNewStoreLink) {
    await routeMessage(merchantId, from, "hi", customerName);
    return;
  }

  // Handle Media messages
  if (messageType !== "text") {
    const mediaTypeMap: Record<string, string> = {
      image: "image",
      video: "video",
      audio: "audio",
      document: "document",
      sticker: "sticker",
    };
    const mediaType = mediaTypeMap[messageType] || "file";
    await sendMediaAcknowledgement(merchantId, from, mediaType);
    return;
  }

  // Handle Text messages
  if (textBody) {
    await routeMessage(merchantId, from, textBody.trim(), customerName);
  }
}

/**
 * Polls the database for PENDING webhook events.
 */
export async function runQueueProcessor() {
  console.log("⚡ Queue Processor Initialized (Meta Cloud API mode)");
  
  setInterval(async () => {
    try {
      // Find one pending job
      const job = await prisma.webhookEvent.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" }
      });

      if (!job) return;

      // Optimistically lock the job
      await prisma.webhookEvent.update({
        where: { id: job.id },
        data: { status: "PROCESSING" }
      });

      console.log(`[QUEUE PROCESSOR] Picked up job ${job.id}`);

      // Process it
      await processJob(job.id, job.payload);

      // Mark completed
      await prisma.webhookEvent.update({
        where: { id: job.id },
        data: { status: "COMPLETED" }
      });

      // Cleanup: delete completed jobs to save DB space
      await prisma.webhookEvent.delete({ where: { id: job.id } });

    } catch (error: any) {
      console.error("[QUEUE PROCESSOR] Error processing job:");
      console.error(error);
      // Failsafe rollback
      try {
        await prisma.webhookEvent.updateMany({
          where: { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - 60000) } },
          data: { status: "FAILED", error: error?.message?.substring(0, 500) }
        });
      } catch (e) {}
    }
  }, 2000); // Polling every 2 seconds
}
