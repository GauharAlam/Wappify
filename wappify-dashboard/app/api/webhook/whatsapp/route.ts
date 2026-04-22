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
 * POST: Acknowledges incoming WhatsApp events.
 *
 * All message processing is handled by the Express backend server.
 * This endpoint only returns 200 to prevent Meta retries if both
 * the dashboard and backend are configured as webhook URLs.
 */
export async function POST(req: NextRequest) {
  console.log(
    "⚠️ [WhatsApp Webhook] POST received on dashboard route — messages are processed by the backend server."
  );

  return NextResponse.json({
    status: "acknowledged",
    message:
      "This endpoint is deprecated. Messages are processed by the wappify-backend server.",
  });
}
