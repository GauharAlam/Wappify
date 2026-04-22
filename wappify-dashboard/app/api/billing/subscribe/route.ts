import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSubscription, PLAN_CONFIG } from "@/lib/razorpay-billing";
import { getAuthContext } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";


// ─────────────────────────────────────────────
// POST /api/billing/subscribe
// Creates a Razorpay subscription for the
// authenticated merchant and returns the
// payment URL for checkout.
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const context = await getAuthContext();

    if (!context?.appUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ── Parse request body ──────────────────
    const body = await req.json();
    const { planTier } = body as { planTier?: string };

    if (!planTier || !["STARTER", "PRO"].includes(planTier)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid plan tier. Use STARTER or PRO (Enterprise requires contacting sales).",
        },
        { status: 400 }
      );
    }

    // ── Find merchant ───────────────────────
    const merchant = await prisma.merchant.findFirst({
      where: { userId: context.appUser.id },
      include: { subscription: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: "No merchant profile found." },
        { status: 404 }
      );
    }

    // ── Check for existing active subscription ──
    if (
      merchant.subscription &&
      ["ACTIVE", "AUTHENTICATED", "CREATED"].includes(
        merchant.subscription.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `You already have an ${merchant.subscription.status.toLowerCase()} subscription on the ${merchant.subscription.planTier} plan.`,
        },
        { status: 409 }
      );
    }

    // ── Create Razorpay subscription ────────
    const razorpaySub = await createSubscription({
      planTier: planTier as "STARTER" | "PRO",
      merchantEmail: context.appUser.email || "",
      merchantName: merchant.name,
      merchantId: merchant.id,
    });

    // ── Upsert subscription in DB ───────────
    const subscription = await prisma.subscription.upsert({
      where: { merchantId: merchant.id },
      create: {
        merchantId: merchant.id,
        planTier: planTier as "STARTER" | "PRO",
        status: "CREATED",
        razorpaySubscriptionId: razorpaySub.id,
        razorpayPlanId: razorpaySub.plan_id,
        razorpayCustomerId: razorpaySub.customer_id,
      },
      update: {
        planTier: planTier as "STARTER" | "PRO",
        status: "CREATED",
        razorpaySubscriptionId: razorpaySub.id,
        razorpayPlanId: razorpaySub.plan_id,
        razorpayCustomerId: razorpaySub.customer_id,
        cancelledAt: null,
      },
    });

    console.log(
      `[BILLING API] ✅ Subscription created for merchant ${merchant.id} → ${razorpaySub.id}`
    );

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      razorpaySubscriptionId: razorpaySub.id,
      checkoutUrl: razorpaySub.short_url,
      planTier,
      planName: PLAN_CONFIG[planTier as keyof typeof PLAN_CONFIG].name,
    });
  } catch (error: any) {
    console.error("[BILLING API] Error creating subscription:", error?.message);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create subscription",
      },
      { status: 500 }
    );
  }
}
