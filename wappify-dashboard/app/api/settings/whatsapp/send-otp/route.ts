import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";
import { sendWhatsAppMessage, normalisePhoneNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const context = await getAuthContext();

  if (!context?.org || !context?.appUser?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { whatsappNumber } = await req.json();

    if (!whatsappNumber || typeof whatsappNumber !== "string") {
      return NextResponse.json(
        { success: false, message: "WhatsApp phone number is required." },
        { status: 400 }
      );
    }

    const cleanedPhone = normalisePhoneNumber(whatsappNumber.trim());

    if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid WhatsApp number with country code (e.g., 919876543210)." },
        { status: 400 }
      );
    }

    // Check if another organization already uses and verified this number
    const existingOtherOrg = await prisma.organization.findFirst({
      where: {
        whatsappNumber: cleanedPhone,
        id: { not: context.org.id },
        whatsappConnected: true,
      },
    });

    if (existingOtherOrg) {
      return NextResponse.json(
        { success: false, message: "This WhatsApp number is already registered and verified with another store." },
        { status: 400 }
      );
    }

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = `wa-verify:${context.org.id}:${cleanedPhone}`;
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Upsert verification token (delete existing token for this identifier if any)
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: otp,
        expires,
      },
    });

    // Send OTP via WhatsApp
    const otpMessage = `🔐 *Wappify Verification Code*\n\nYour 6-digit verification code is: *${otp}*\n\nThis code will expire in 10 minutes. Please enter it in your dashboard to connect your WhatsApp number.`;

    try {
      await sendWhatsAppMessage(context.org.id, cleanedPhone, otpMessage);
    } catch (sendError: any) {
      console.error("[SEND OTP] WhatsApp send failed:", sendError?.message || sendError);
      return NextResponse.json(
        {
          success: false,
          message: "Could not deliver WhatsApp message. Please verify the number and ensure your Twilio backend service is active.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your WhatsApp number!",
    });
  } catch (error: any) {
    console.error("[API /settings/whatsapp/send-otp] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to send verification code." },
      { status: 500 }
    );
  }
}
