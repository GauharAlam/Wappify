import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// GET /api/inbox/[conversationId] — Fetch messages
// ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const context = await getAuthContext();
  if (!context?.org) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  try {
    // Verify conversation belongs to this org
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: context.org.id },
      include: {
        contact: true,
        assignedTo: {
          select: { id: true, email: true, role: true, user: { select: { name: true, image: true } } },
        },
        tags: { include: { tag: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found." },
        { status: 404 }
      );
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        senderMember: {
          select: { id: true, email: true, role: true, user: { select: { name: true, image: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read (reset unread count)
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    console.error("[API /inbox/[id] GET] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch conversation." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// PATCH /api/inbox/[conversationId] — Update conversation
// (assign, change status, etc.)
// ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const context = await getAuthContext();
  if (!context?.org || !context.membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  try {
    const body = await req.json();
    const { status, assignedToId } = body;

    // Verify conversation belongs to this org
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: context.org.id },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found." },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status && ["OPEN", "ASSIGNED", "RESOLVED", "CLOSED"].includes(status)) {
      updateData.status = status;
    }

    if (assignedToId !== undefined) {
      if (assignedToId === null) {
        updateData.assignedToId = null;
        updateData.status = "OPEN";
      } else {
        // Verify the assignee is a member of this org
        const assignee = await prisma.orgMember.findFirst({
          where: { id: assignedToId, orgId: context.org.id, isActive: true },
        });

        if (!assignee) {
          return NextResponse.json(
            { success: false, message: "Assignee not found in this organization." },
            { status: 400 }
          );
        }

        updateData.assignedToId = assignedToId;
        if (!updateData.status) {
          updateData.status = "ASSIGNED";
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update." },
        { status: 400 }
      );
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        contact: true,
        assignedTo: {
          select: { id: true, email: true, role: true, user: { select: { name: true } } },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: context.org.id,
        userId: context.appUser.id,
        action: "UPDATE_CONVERSATION",
        entity: "Conversation",
        entityId: conversationId,
        metadata: updateData,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API /inbox/[id] PATCH] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update conversation." },
      { status: 500 }
    );
  }
}
