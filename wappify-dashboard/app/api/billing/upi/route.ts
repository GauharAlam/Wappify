import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredOrg } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const org = await getRequiredOrg();
    const { planTier, upiRef } = await req.json();

    if (!planTier || !upiRef) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upsert subscription as PENDING for Admin Review
    const subscription = await prisma.subscription.upsert({
      where: { orgId: org.id },
      update: {
        planTier: planTier,
        status: "PENDING",
        paymentMethod: "UPI",
        upiTransactionRef: upiRef,
      },
      create: {
        orgId: org.id,
        planTier: planTier,
        status: "PENDING",
        paymentMethod: "UPI",
        upiTransactionRef: upiRef,
      },
    });

    console.log("[UPI BILLING] Created pending subscription for:", org.id);

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error("[API /billing/upi] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit UPI payment" },
      { status: 500 }
    );
  }
}
