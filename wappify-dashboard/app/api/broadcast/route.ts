import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const merchant = await prisma.merchant.findFirst({
        where: { userId: session.user.id }
    });

    if (!merchant || !merchant.whatsappPhoneId || !merchant.whatsappAccessToken) {
        return NextResponse.json({ error: "WhatsApp API not configured" }, { status: 400 });
    }

    // Trigger the send
    await sendWhatsAppMessage(
        merchant.whatsappPhoneId,
        merchant.whatsappAccessToken,
        to,
        message
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [Broadcast API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
