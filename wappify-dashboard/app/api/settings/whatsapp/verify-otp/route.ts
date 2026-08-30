import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";
import { normalisePhoneNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const context = await getAuthContext();

  if (!context?.org || !context?.appUser?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { whatsappNumber, otp } = await req.json();

    if (!whatsappNumber || typeof whatsappNumber !== "string") {
      return NextResponse.json(
        { success: false, message: "WhatsApp phone number is required." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { success: false, message: "Please enter the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    const cleanedPhone = normalisePhoneNumber(whatsappNumber.trim());
    const cleanedOtp = otp.trim();
    const identifier = `wa-verify:${context.org.id}:${cleanedPhone}`;

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: cleanedOtp,
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    if (new Date() > record.expires) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // OTP is valid! Delete used token
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    // Update organization with verified WhatsApp number
    const updatedOrg = await prisma.organization.update({
      where: { id: context.org.id },
      data: {
        whatsappNumber: cleanedPhone,
        whatsappConnected: true,
      },
      select: {
        id: true,
        whatsappNumber: true,
        whatsappConnected: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp number verified and connected successfully! 🎉",
      data: updatedOrg,
    });
  } catch (error: any) {
    console.error("[API /settings/whatsapp/verify-otp] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
