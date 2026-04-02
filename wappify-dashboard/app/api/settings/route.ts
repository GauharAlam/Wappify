import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const merchantId = session?.user?.merchantId;

  if (!merchantId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        whatsappNumber: true,
        whatsappPhoneId: true,
        whatsappAccessToken: true, // Fetch to mask it
        razorpayKeyId: true,
        razorpayKeySecret: true, // Fetch to mask it
        aiContext: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: "Merchant not found. Run the backend server first to seed data." },
        { status: 404 }
      );
    }

    // Mask secrets for safety
    const mask = (val: string | null) => 
      val ? `••••••••${val.slice(-4)}` : null;

    const data = {
      ...merchant,
      whatsappAccessToken: mask(merchant.whatsappAccessToken),
      razorpayKeySecret: mask(merchant.razorpayKeySecret),
      createdAt: merchant.createdAt.toISOString(),
      updatedAt: merchant.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API /settings GET] Error:", message);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const merchantId = session?.user?.merchantId;

  if (!merchantId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    const body = await req.json();

    // ── Whitelist only the fields that are safe to update ─────────────────
    // Never allow merchantId, id, or createdAt to be overwritten via API.
    const {
      name,
      whatsappNumber,
      whatsappPhoneId,
      whatsappAccessToken,
      razorpayKeyId,
      razorpayKeySecret,
      aiContext,
    } = body;

    // Build the update payload — only include keys that were actually sent
    const updateData: Record<string, unknown> = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof whatsappNumber === "string" && whatsappNumber.trim()) {
      updateData.whatsappNumber = whatsappNumber.trim();
    }

    if (typeof whatsappPhoneId === "string") {
      updateData.whatsappPhoneId = whatsappPhoneId.trim() || null;
    }

    // Only update token if a non-empty value was explicitly provided.
    // An empty string means "don't change it".
    if (typeof whatsappAccessToken === "string" && whatsappAccessToken.trim()) {
      updateData.whatsappAccessToken = whatsappAccessToken.trim();
    }

    if (typeof razorpayKeyId === "string") {
      updateData.razorpayKeyId = razorpayKeyId.trim() || null;
    }

    if (typeof razorpayKeySecret === "string" && razorpayKeySecret.trim()) {
      updateData.razorpayKeySecret = razorpayKeySecret.trim();
    }

    if (typeof aiContext === "string") {
      updateData.aiContext = aiContext.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        whatsappNumber: true,
        whatsappPhoneId: true,
        razorpayKeyId: true,
        aiContext: true,
        updatedAt: true,
      },
    });

    console.log(`[API /settings PATCH] Merchant ${merchantId} updated fields:`, Object.keys(updateData));

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      data: {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API /settings PATCH] Error:", message);
    return NextResponse.json(
      { success: false, message: "Failed to update settings." },
      { status: 500 }
    );
  }
}
