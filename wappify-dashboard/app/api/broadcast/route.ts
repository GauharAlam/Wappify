import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { getAuthContext } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const context = await getAuthContext();

    if (!context?.appUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const merchant = context.merchant;

    if (!merchant || !merchant.whatsappNumber) {
        return NextResponse.json({ error: "WhatsApp not configured. Complete onboarding first." }, { status: 400 });
    }

    // Send via the centralised Meta Cloud API (through the backend)
    await sendWhatsAppMessage(to, message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [Broadcast API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
