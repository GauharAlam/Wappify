import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/razorpay-billing";

export const dynamic = "force-dynamic";


// ─────────────────────────────────────────────
// POST /api/billing/cancel
// Cancels the merchant's active Razorpay
// subscription at the end of the billing cycle.
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ── Find merchant + subscription ────────
    const merchant = await prisma.merchant.findFirst({
      where: { userId: session.user.id },
      include: { subscription: true },
    });

    if (!merchant?.subscription) {
      return NextResponse.json(
        { success: false, message: "No active subscription found." },
        { status: 404 }
      );
    }

    const sub = merchant.subscription;

    if (!["ACTIVE", "AUTHENTICATED", "PENDING"].includes(sub.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Subscription is already ${sub.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    if (!sub.razorpaySubscriptionId) {
      return NextResponse.json(
        {
          success: false,
          message: "No Razorpay subscription ID linked.",
        },
        { status: 400 }
      );
    }

    // ── Cancel on Razorpay ──────────────────
    await cancelSubscription(sub.razorpaySubscriptionId, true);

    // ── Update DB ───────────────────────────
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    console.log(
      `[BILLING API] ✅ Subscription cancelled for merchant ${merchant.id}`
    );

    return NextResponse.json({
      success: true,
      message:
        "Subscription cancelled. You will have access until the end of your current billing period.",
    });
  } catch (error: any) {
    console.error(
      "[BILLING API] Error cancelling subscription:",
      error?.message
    );
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to cancel subscription",
      },
      { status: 500 }
    );
  }
}
