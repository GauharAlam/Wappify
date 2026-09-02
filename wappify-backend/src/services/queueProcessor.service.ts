import { prisma } from "../lib/prisma";
import { routeMessage } from "./messageRouter.service";
import { redis } from "../lib/redis";
import { normaliseTwilioWhatsAppNumber, sendTwilioTextMessage } from "./twilioWhatsapp.service";

const POLL_INTERVAL_MS = Number(process.env.WEBHOOK_QUEUE_POLL_MS || 2_000);
const MAX_QUEUE_ATTEMPTS = Number(process.env.WEBHOOK_QUEUE_MAX_ATTEMPTS || 5);
const COMPLETED_EVENT_RETENTION_DAYS = Number(process.env.WEBHOOK_EVENT_RETENTION_DAYS || 14);

// ─────────────────────────────────────────────
// Store-code routing map (Redis Cache)
// Maps customer wa_id → orgId after their
// first message contains a store code.
// ─────────────────────────────────────────────

// const customerMerchantMap = new Map<string, string>(); // Deprecated in-memory cache

/**
 * Generates the shareable WhatsApp link for a merchant.
 * Customers click this link and auto-send the store code.
 */
export const getShareableLink = (storeCode: string): string => {
  const waNumber = process.env.TWILIO_WHATSAPP_NUMBER || "";
  return `https://wa.me/${waNumber}?text=STORE-${storeCode}`;
};

// ─────────────────────────────────────────────
// Parse Meta Cloud API webhook payload
// ─────────────────────────────────────────────

interface ParsedTwilioMessage {
  from: string;        // Customer's WhatsApp number (e.g. "919876543210")
  messageId: string;   // Meta message ID (wamid.xxx)
  customerName?: string;
  messageType: string; // "text", "image", "video", "audio", "document", "sticker", etc.
  textBody?: string;   // Only present for type "text"
  phoneNumber: string;
}

const parseTwilioPayload = (payload: Record<string, string>): ParsedTwilioMessage | null => {
  try {
    if (!payload.From?.startsWith("whatsapp:")) return null;

    return {
      from: normaliseTwilioWhatsAppNumber(payload.From),
      messageId: payload.MessageSid || "",
      customerName: payload.ProfileName || undefined,
      messageType: Number(payload.NumMedia || "0") > 0 ? "media" : "text",
      textBody: payload.Body || undefined,
      phoneNumber: normaliseTwilioWhatsAppNumber(payload.To || ""),
    };
  } catch (err) {
    console.error("[QUEUE PROCESSOR] Failed to parse Twilio payload:", err);
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
 * 3. Check the DB for any existing Message from this customer → derive orgId
 * 4. If only one merchant exists in the system, default to that
 */
const resolveMerchant = async (
  from: string,
  textBody?: string,
): Promise<{ orgId: string; isNewStoreLink: boolean; textOverride?: string } | null> => {

  // ── 1. Explicit store code in message ──────
  if (textBody) {
    const match = textBody.trim().match(STORE_CODE_REGEX);
    if (match) {
      const code = match[1].toUpperCase();
      const merchant = await prisma.organization.findUnique({
        where: { storeCode: code },
        select: { id: true },
      });

      if (merchant) {
        // Cache for 24 hours (86400 seconds)
        await redis.setex(`route:${from}`, 86400, merchant.id).catch(e => console.warn("Redis set failed", e));
        console.log(`[QUEUE PROCESSOR] Store code "${code}" → merchant ${merchant.id}`);
        return { orgId: merchant.id, isNewStoreLink: true };
      } else {
        console.warn(`[QUEUE PROCESSOR] Unknown store code: "${code}"`);
        return null;
      }
    }
  }

  // ── 2. Redis Cache ─────────────────────────
  try {
    const cachedMerchantId = await redis.get(`route:${from}`);
    if (cachedMerchantId) {
      // Refresh TTL
      redis.expire(`route:${from}`, 86400).catch(()=>{});
      return { orgId: cachedMerchantId, isNewStoreLink: false };
    }
  } catch (err) {
    console.warn("[QUEUE PROCESSOR] Redis get failed, bypassing cache", err);
  }

  // ── 3. Previous chat history in DB ─────────
  const previousChat = await prisma.message.findFirst({
    where: { conversation: { contact: { waId: from } } },
    orderBy: { createdAt: "desc" },
    select: { orgId: true },
  });

  if (previousChat) {
    await redis.setex(`route:${from}`, 86400, previousChat.orgId).catch(()=>{});
    return { orgId: previousChat.orgId, isNewStoreLink: false };
  }

  // ── 4. Single-merchant fallback ────────────
  const merchantCount = await prisma.organization.count();
  if (merchantCount === 1) {
    const merchant = await prisma.organization.findFirst({ select: { id: true } });
    if (merchant) {
      await redis.setex(`route:${from}`, 86400, merchant.id).catch(()=>{});
      return { orgId: merchant.id, isNewStoreLink: false };
    }
  }

  return null;
};

// ─────────────────────────────────────────────
// Process a single WebhookEvent
// ─────────────────────────────────────────────

async function processJob(jobId: string, payload: any) {
  const parsed = parseTwilioPayload(payload);

  if (!parsed) {
    // Status update or unparseable — silently skip
    return;
  }

  const { from, messageId, customerName, messageType, textBody } = parsed;

  if (!from) return;

  console.log(`[QUEUE PROCESSOR] Processing WhatsApp message ${messageId || jobId}.`);

  // ── Resolve merchant via store-code routing ──
  const resolution = await resolveMerchant(from, textBody);

  if (!resolution) {
    console.warn("[QUEUE PROCESSOR] Could not resolve a merchant for an incoming message.");

    // Send a helper message to unrouted customers
    try {
      await sendTwilioTextMessage(
        from,
        "👋 Welcome to Wappify!\n\nIt looks like you reached us without a store link. Please ask the merchant for their WhatsApp store link to get started. 🙏",
      );
    } catch (e) {
      console.error("[QUEUE PROCESSOR] Failed to send unrouted-customer message:", e);
    }
    return;
  }

  const { orgId, isNewStoreLink } = resolution;

  // If this was a store-code message, treat it as a greeting instead
  if (isNewStoreLink) {
    await routeMessage(orgId, from, "hi", customerName);
    return;
  }

  // Handle Media messages
  if (messageType !== "text") {
    await routeMessage(orgId, from, "", customerName, true);
    return;
  }

  // Handle Text messages
  if (textBody) {
    await routeMessage(orgId, from, textBody.trim(), customerName, false);
  }
}

/**
 * Polls the database for PENDING webhook events.
 * Uses a draining loop to process queued events quickly under burst load.
 */
export async function runQueueProcessor() {
  console.log("⚡ Queue Processor Initialized (Twilio WhatsApp mode)");

  let isProcessing = false;
  let lastRetentionCleanup = 0;
  const MAX_BATCH_PER_TICK = 10;

  const drainQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      // Recover jobs stranded by a process restart before reserving the next job.
      await prisma.webhookEvent.updateMany({
        where: { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
        data: { status: "PENDING", nextAttemptAt: new Date() },
      });

      let hasMore = true;
      let drainedCount = 0;

      while (hasMore && drainedCount < MAX_BATCH_PER_TICK) {
        const jobs = await prisma.$queryRaw<Array<{ id: string; payload: unknown; attempts: number }>>`
          UPDATE "WebhookEvent"
          SET status = 'PROCESSING', attempts = attempts + 1, "updatedAt" = NOW()
          WHERE id = (
            SELECT id
            FROM "WebhookEvent"
            WHERE status = 'PENDING'
              AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
            ORDER BY "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          )
          RETURNING id, payload, attempts;
        `;

        if (!jobs || jobs.length === 0) {
          hasMore = false;
          break;
        }

        drainedCount++;
        const job = jobs[0];
        console.log(`[QUEUE PROCESSOR] Processing event ${job.id}, attempt ${job.attempts}.`);

        try {
          await processJob(job.id, job.payload);
          await prisma.webhookEvent.update({
            where: { id: job.id },
            data: { status: "COMPLETED", error: null, nextAttemptAt: null },
          });
        } catch (error: any) {
          const isFinalAttempt = job.attempts >= MAX_QUEUE_ATTEMPTS;
          const backoffMinutes = Math.min(2 ** (job.attempts - 1), 60);
          const errorMessage = error instanceof Error ? error.message.slice(0, 500) : "Unknown webhook processing error";

          await prisma.webhookEvent.update({
            where: { id: job.id },
            data: {
              status: isFinalAttempt ? "FAILED" : "PENDING",
              error: errorMessage,
              nextAttemptAt: isFinalAttempt ? null : new Date(Date.now() + backoffMinutes * 60 * 1000),
            },
          });
          console.error(`[QUEUE PROCESSOR] Event ${job.id} ${isFinalAttempt ? "failed permanently" : "scheduled for retry"}.`);
        }
      }

      if (Date.now() - lastRetentionCleanup > 24 * 60 * 60 * 1000) {
        lastRetentionCleanup = Date.now();
        await prisma.webhookEvent.deleteMany({
          where: {
            status: "COMPLETED",
            updatedAt: { lt: new Date(Date.now() - COMPLETED_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000) },
          },
        });
      }
    } catch (error: any) {
      console.error("[QUEUE PROCESSOR] Could not reserve or update a webhook event:", error?.message || "Unknown error");
    } finally {
      isProcessing = false;
    }
  };

  await drainQueue();
  setInterval(() => void drainQueue(), POLL_INTERVAL_MS);
}
