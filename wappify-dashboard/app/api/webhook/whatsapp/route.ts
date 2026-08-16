import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";


/**
 * WhatsApp Webhook Handler — DEPRECATED
 *
 * The primary WhatsApp webhook handler lives in the Express backend
 * (`wappify-backend/src/controllers/whatsappWebhook.controller.ts`).
 *
 * That handler provides:
 * - Gemini 1.5 Flash with conversation memory
 * - Full message routing (greeting, catalog, order, AI)
 * - Razorpay payment link generation
 * - DB-backed webhook queue for reliability
 *
 * This Next.js route is kept as a fallback webhook verification endpoint
 * only. It does NOT process incoming messages.
 */

/**
 * GET: Verifies the webhook with Meta (handshake).
 * Meta sends a GET request with a challenge and verify token.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ [WhatsApp Webhook] Verification successful!");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("❌ [WhatsApp Webhook] Verification failed. Invalid token.");
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST: Rejects incoming events.
 *
 * All message processing is handled by the Express backend at
 * `/api/webhooks/whatsapp`, where Meta signatures are verified and events
 * are queued durably. A 410 makes a misconfigured callback visible instead
 * of silently acknowledging and losing customer messages.
 */
export async function POST() {
  console.warn("[WhatsApp Webhook] Deprecated dashboard webhook endpoint received a POST.");
  return NextResponse.json(
    { error: "Webhook endpoint moved. Configure Meta to use the backend /api/webhooks/whatsapp endpoint." },
    { status: 410 },
  );
}
