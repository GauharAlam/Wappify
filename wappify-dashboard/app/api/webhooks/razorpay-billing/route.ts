import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";


// ─────────────────────────────────────────────
// POST /api/webhooks/razorpay-billing
// Handles Razorpay subscription lifecycle
// events via webhook.
// ─────────────────────────────────────────────

// Disable body parsing — we need the raw body for HMAC verification
export const runtime = "nodejs";

// ─────────────────────────────────────────────
// Signature Verification
// ─────────────────────────────────────────────

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_BILLING_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      "[BILLING WEBHOOK] ⚠️ RAZORPAY_BILLING_WEBHOOK_SECRET not set — skipping signature check (dev mode)"
    );
    return true;
  }

  if (!signature) {
    console.warn("[BILLING WEBHOOK] ❌ No signature header present");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const isValid = expected === signature;

  if (!isValid) {
    console.warn("[BILLING WEBHOOK] ❌ Signature mismatch");
  } else {
    console.log("[BILLING WEBHOOK] ✅ Signature verified");
  }

  return isValid;
}

// ─────────────────────────────────────────────
// Status mapping from Razorpay → our enum
// ─────────────────────────────────────────────

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  created: "CREATED",
  authenticated: "AUTHENTICATED",
  active: "ACTIVE",
  pending: "PENDING",
  halted: "HALTED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
  paused: "PAUSED",
};

// ─────────────────────────────────────────────
// Webhook Handler
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  console.log("\n================ BILLING WEBHOOK RECEIVED ================");
  console.log("[BILLING WEBHOOK] Timestamp:", new Date().toISOString());

  // ── Step 1: Verify signature ──────────────
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { success: false, message: "Invalid signature" },
      { status: 400 }
    );
  }

  // ── Step 2: Parse event ───────────────────
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const eventType: string = event?.event || "";
  console.log("[BILLING WEBHOOK] Event Type:", eventType);

  // Acknowledge immediately
  const response = NextResponse.json({
    success: true,
    message: "Webhook received",
  });

  // ── Step 3: Process event ─────────────────
  try {
    const subscriptionEntity = event?.payload?.subscription?.entity;

    if (!subscriptionEntity) {
      console.warn("[BILLING WEBHOOK] No subscription entity in payload");
      return response;
    }

    const razorpaySubId: string = subscriptionEntity.id || "";
    const razorpayStatus: string = subscriptionEntity.status || "";
    const currentStart: number | null = subscriptionEntity.current_start;
    const currentEnd: number | null = subscriptionEntity.current_end;
    const notes = subscriptionEntity.notes || {};

    console.log("[BILLING WEBHOOK] Subscription ID:", razorpaySubId);
    console.log("[BILLING WEBHOOK] Razorpay Status:", razorpayStatus);
    console.log("[BILLING WEBHOOK] Merchant ID:", notes.merchant_id || "N/A");

    // Map to our status enum
    const mappedStatus = STATUS_MAP[razorpayStatus];
    if (!mappedStatus) {
      console.warn(
        `[BILLING WEBHOOK] Unknown status "${razorpayStatus}" — ignoring`
      );
      return response;
    }

    // Find existing subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: razorpaySubId },
    });

    if (!existingSub) {
      console.warn(
        `[BILLING WEBHOOK] ⚠️ No subscription found for Razorpay ID: ${razorpaySubId}`
      );
      return response;
    }

    // Build update payload
    const updateData: any = {
      status: mappedStatus,
    };

    // Update billing period dates
    if (currentStart) {
      updateData.currentPeriodStart = new Date(currentStart * 1000);
    }
    if (currentEnd) {
      updateData.currentPeriodEnd = new Date(currentEnd * 1000);
    }

    // Handle specific events
    switch (eventType) {
      case "subscription.activated":
        console.log("[BILLING WEBHOOK] 🎉 Subscription activated!");
        break;

      case "subscription.charged":
        console.log("[BILLING WEBHOOK] 💰 Subscription charged — renewing period");
        break;

      case "subscription.cancelled":
        updateData.cancelledAt = new Date();
        console.log("[BILLING WEBHOOK] ❌ Subscription cancelled");
        break;

      case "subscription.halted":
        console.log("[BILLING WEBHOOK] ⚠️ Subscription halted — payment failed");
        break;

      case "subscription.expired":
        console.log("[BILLING WEBHOOK] ⏰ Subscription expired");
        break;

      case "subscription.paused":
        console.log("[BILLING WEBHOOK] ⏸️ Subscription paused");
        break;

      default:
        console.log(
          `[BILLING WEBHOOK] Handling event: ${eventType} → status: ${mappedStatus}`
        );
    }

    // Save to DB
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: updateData,
    });

    console.log(
      `[BILLING WEBHOOK] ✅ Subscription ${existingSub.id} updated to ${mappedStatus}`
    );
  } catch (error: any) {
    console.error(
      "[BILLING WEBHOOK] ❌ Error processing event:",
      error?.message
    );
  }

  return response;
}
