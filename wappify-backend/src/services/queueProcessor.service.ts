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
 * Twilio payloads are flat form-data objects.
 */
async function processJob(jobId: string, payload: any) {
  // ── Delivery / read status updates ─────
  if (payload.MessageStatus || payload.SmsStatus) {
    // Can log robustly or update database status
    // console.log(`[QUEUE] Status ${payload.MessageStatus} for ${payload.MessageSid}`);
    return;
  }

  // ── Incoming messages ──────────────────
  const from: string = payload.From || "";
  const messageId: string = payload.SmsMessageSid || payload.MessageSid || "";
  const customerName: string | undefined = payload.ProfileName || undefined;
  const numMedia: number = parseInt(payload.NumMedia || "0", 10);

  if (!from) return;

  console.log(`[QUEUE PROCESSOR] Processing message ${messageId} from ${from}`);

  // Handle Media messages
  if (numMedia > 0) {
    const contentType: string = payload.MediaContentType0 || "";
    let mediaType = "file";
    
    if (contentType.startsWith("image/")) mediaType = "image";
    else if (contentType.startsWith("video/")) mediaType = "video";
    else if (contentType.startsWith("audio/")) mediaType = "audio";
    else if (contentType.includes("document") || contentType.includes("pdf")) mediaType = "document";
    
    await sendMediaAcknowledgement(from, mediaType);
    return;
  }

  // Handle Text messages
  const textBody: string = payload.Body || "";
  if (textBody) {
    await routeMessage(from, textBody.trim(), customerName);
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
