import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAiResponse } from "@/lib/ai";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * GET Handler: Verifies the webhook with Meta (handshake).
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
 * POST Handler: Processes incoming messages from WhatsApp.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Log the raw payload for debugging ──────
    // console.log("📩 [WhatsApp Webhook] Received payload:", JSON.stringify(body, null, 2));

    // Meta sends multiple entries/changes in one request
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ status: "ignored" });
    }

    // ── Metadata: Which phone number received this? ──
    const metadata = value.metadata;
    const phoneNumberId = metadata?.phone_number_id;

    if (!phoneNumberId) {
      return NextResponse.json({ status: "ignored" });
    }

    // ── Find Merchant ────────────────────────
    const merchant = await prisma.merchant.findFirst({
      where: { whatsappPhoneId: phoneNumberId },
    });

    if (!merchant) {
      console.warn(`⚠️ [WhatsApp Webhook] No merchant found for PhoneID: ${phoneNumberId}`);
      return NextResponse.json({ status: "merchant_not_found" });
    }

    // ── Extract Messages ──────────────────────
    const messages = value.messages;
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const from = msg.from; // Customer's WA ID
        const messageId = msg.id;
        const type = msg.type;

        // Handle text messages
        if (type === "text") {
          const textBody = msg.text?.body;
          console.log(`💬 [WhatsApp Webhook] New text from ${from} for merchant "${merchant.name}": "${textBody}"`);

          if (textBody && merchant.whatsappAccessToken) {
            try {
              // 1. Generate AI Response
              const aiResponse = await generateAiResponse(merchant.id, textBody);
              console.log(`🤖 [AI Engine] AI response generated for ${from}`);

              // 2. Send back to WhatsApp
              await sendWhatsAppMessage(
                merchant.whatsappPhoneId!,
                merchant.whatsappAccessToken,
                from,
                aiResponse
              );
            } catch (err) {
              console.error("❌ [Webhook AI Logic Error]", err);
            }
          }
        }

        // Future: Handle button clicks, locations, images, etc.
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("❌ [WhatsApp Webhook] Error processing POST:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
