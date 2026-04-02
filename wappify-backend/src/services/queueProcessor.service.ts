import { prisma } from "../lib/prisma";
import { routeMessage } from "./messageRouter.service";
import { sendMediaAcknowledgement } from "./whatsapp.service";

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[Unable to stringify payload]";
  }
};

/**
 * Robustly processes a single WebhookEvent.
 */
async function processJob(jobId: string, payload: any) {
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value;

      // ── Incoming messages ──────────────────
      if (Array.isArray(value?.messages)) {
        const contacts: any[] = Array.isArray(value?.contacts)
          ? value.contacts
          : [];

        for (const message of value.messages) {
          const from: string = message?.from || "";
          const messageId: string = message?.id || "";
          const timestamp: string = message?.timestamp || "";
          const type: string = message?.type || "";

          const contact = contacts.find((c: any) => c?.wa_id === from);
          const customerName: string | undefined =
            contact?.profile?.name || undefined;

          console.log(`[QUEUE PROCESSOR] Processing message ${messageId} from ${from}`);

          if (type === "text") {
            const textBody: string = message?.text?.body || "";
            if (from && textBody) {
              await routeMessage(from, textBody, customerName);
            }
          } else {
            const mediaTypes = ["image", "video", "audio", "document", "sticker"];
            if (from && mediaTypes.includes(type)) {
              await sendMediaAcknowledgement(from, type);
            }
          }
        }
      }

      // ── Delivery / read status updates ─────
      if (Array.isArray(value?.statuses)) {
        for (const status of value.statuses) {
           // Can log robustly or update database status
           // console.log(`[QUEUE] Status ${status.status} for ${status.id}`);
        }
      }
    }
  }
}

/**
 * Polls the database for PENDING webhook events.
 */
export async function runQueueProcessor() {
  console.log("⚡ Queue Processor Initialized");
  
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

      // Cleanup: We can optionally delete completed jobs immediately to save DB space
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
