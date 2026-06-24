import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// GET /api/inbox — List conversations
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const context = await getAuthContext();
  if (!context?.org) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assignedToMe = searchParams.get("mine") === "true";
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const where: any = { orgId: context.org.id };

    if (status && ["OPEN", "ASSIGNED", "RESOLVED", "CLOSED"].includes(status)) {
      where.status = status;
    }

    if (assignedToMe && context.membership) {
      where.assignedToId = context.membership.id;
    }

    if (search) {
      where.contact = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { waId: { contains: search } },
        ],
      };
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          contact: {
            select: { id: true, name: true, waId: true },
          },
          assignedTo: {
            select: { id: true, email: true, role: true, user: { select: { name: true, image: true } } },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: conversations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[API /inbox GET] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch conversations." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// POST /api/inbox — Send a message from dashboard
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const context = await getAuthContext();
  if (!context?.org || !context.membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, content } = await req.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: "Conversation ID and message content are required." },
        { status: 400 }
      );
    }

    // Verify conversation belongs to this org
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: context.org.id },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found." },
        { status: 404 }
      );
    }

    // Create the message record
    const message = await prisma.message.create({
      data: {
        orgId: context.org.id,
        conversationId,
        direction: "OUTBOUND",
        content: content.trim(),
        type: "TEXT",
        senderMemberId: context.membership.id,
      },
    });

    // Update conversation metadata
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
        lastMessagePreview: content.trim().slice(0, 100),
        status: conversation.status === "OPEN" ? "ASSIGNED" : conversation.status,
        assignedToId: conversation.assignedToId ?? context.membership.id,
      },
    });

    // Send via WhatsApp API
    try {
      const waResponse = await fetch(
        `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: conversation.contact.waId,
            text: { body: content.trim() },
          }),
        }
      );

      if (!waResponse.ok) {
        console.error("[API /inbox POST] WhatsApp API error:", await waResponse.text());
      }
    } catch (waError) {
      console.error("[API /inbox POST] Failed to send WhatsApp message:", waError);
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("[API /inbox POST] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message." },
      { status: 500 }
    );
  }
}
