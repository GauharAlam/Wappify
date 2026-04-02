import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/webhook/razorpay
 * Handles incoming payment events from Razorpay.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    // ── 1. Verify Signature ───────────────────
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ [Razorpay Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log(`📩 [Razorpay Webhook] Received event: ${event.event}`);

    // ── 2. Handle Events ──────────────────────
    if (event.event === "order.paid") {
      const { entity } = event.payload.order;
      const razorpayOrderId = entity.id;

      console.log(`✅ [Razorpay Webhook] Order PAID: ${razorpayOrderId}`);

      // Find and update the order
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: "PAID",
            razorpayPaymentId: event.payload.payment?.entity?.id || order.razorpayPaymentId 
          },
        });
        console.log(`📦 [Database] Order ${order.id} marked as PAID`);
      } else {
        console.warn(`⚠️ [Razorpay Webhook] No matching Order found for RZP ID: ${razorpayOrderId}`);
      }
    }

    // Acknowledge receipt
    return NextResponse.json({ status: "success" });

  } catch (error) {
    console.error("❌ [Razorpay Webhook] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
