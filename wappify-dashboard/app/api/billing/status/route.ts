import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/razorpay-billing";

// ─────────────────────────────────────────────
// GET /api/billing/status
// Returns the current subscription status
// for the authenticated merchant.
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
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

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: "No merchant profile found." },
        { status: 404 }
      );
    }

    const sub = merchant.subscription;

    if (!sub) {
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        subscription: null,
      });
    }

    const planInfo = PLAN_CONFIG[sub.planTier as keyof typeof PLAN_CONFIG];

    return NextResponse.json({
      success: true,
      hasSubscription: true,
      subscription: {
        id: sub.id,
        planTier: sub.planTier,
        planName: planInfo?.name || sub.planTier,
        planPrice: planInfo?.price || 0,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        cancelledAt: sub.cancelledAt,
        createdAt: sub.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[BILLING API] Error fetching status:", error?.message);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch billing status",
      },
      { status: 500 }
    );
  }
}
