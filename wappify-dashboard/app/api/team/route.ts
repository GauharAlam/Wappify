import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// GET /api/team — List organization members
// ─────────────────────────────────────────────

export async function GET() {
  const context = await getAuthContext();
  if (!context?.org) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const members = await prisma.orgMember.findMany({
      where: { orgId: context.org.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error("[API /team GET] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch team members." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// POST /api/team — Invite a new member
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const context = await getAuthContext();
  if (!context?.org || !context.membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Only OWNER and ADMIN can invite
  if (!["OWNER", "ADMIN"].includes(context.membership.role)) {
    return NextResponse.json(
      { success: false, message: "Only owners and admins can invite team members." },
      { status: 403 }
    );
  }

  try {
    const { email, role } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "AGENT"];
    const memberRole = validRoles.includes(role) ? role : "AGENT";

    // Prevent non-owners from creating admins
    if (memberRole === "ADMIN" && context.membership.role !== "OWNER") {
      return NextResponse.json(
        { success: false, message: "Only the owner can create admin members." },
        { status: 403 }
      );
    }

    // Check if already a member
    const existing = await prisma.orgMember.findUnique({
      where: {
        orgId_email: {
          orgId: context.org.id,
          email: email.trim().toLowerCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "This email is already a team member." },
        { status: 409 }
      );
    }

    // Check if user already exists in the platform
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    const newMember = await prisma.orgMember.create({
      data: {
        orgId: context.org.id,
        userId: existingUser?.id ?? null,
        email: email.trim().toLowerCase(),
        role: memberRole,
        joinedAt: existingUser ? new Date() : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: context.org.id,
        userId: context.appUser.id,
        action: "INVITE_MEMBER",
        entity: "OrgMember",
        entityId: newMember.id,
        metadata: { email: email.trim().toLowerCase(), role: memberRole },
      },
    });

    return NextResponse.json({
      success: true,
      message: existingUser
        ? `${email} has been added to the team.`
        : `Invitation sent to ${email}. They'll be added when they sign up.`,
      data: newMember,
    });
  } catch (error) {
    console.error("[API /team POST] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to invite team member." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// PATCH /api/team — Update member role
// ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const context = await getAuthContext();
  if (!context?.org || !context.membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (context.membership.role !== "OWNER") {
    return NextResponse.json(
      { success: false, message: "Only the owner can change member roles." },
      { status: 403 }
    );
  }

  try {
    const { memberId, role } = await req.json();

    if (!memberId || !role) {
      return NextResponse.json(
        { success: false, message: "Member ID and role are required." },
        { status: 400 }
      );
    }

    // Can't change own role
    if (memberId === context.membership.id) {
      return NextResponse.json(
        { success: false, message: "You cannot change your own role." },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "AGENT"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role. Must be ADMIN or AGENT." },
        { status: 400 }
      );
    }

    const updated = await prisma.orgMember.update({
      where: { id: memberId, orgId: context.org.id },
      data: { role },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API /team PATCH] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update member role." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// DELETE /api/team — Remove member
// ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const context = await getAuthContext();
  if (!context?.org || !context.membership) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!["OWNER", "ADMIN"].includes(context.membership.role)) {
    return NextResponse.json(
      { success: false, message: "Only owners and admins can remove members." },
      { status: 403 }
    );
  }

  try {
    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "Member ID is required." },
        { status: 400 }
      );
    }

    // Can't remove self
    if (memberId === context.membership.id) {
      return NextResponse.json(
        { success: false, message: "You cannot remove yourself." },
        { status: 400 }
      );
    }

    // Can't remove the owner
    const target = await prisma.orgMember.findUnique({
      where: { id: memberId, orgId: context.org.id },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, message: "Member not found." },
        { status: 404 }
      );
    }

    if (target.role === "OWNER") {
      return NextResponse.json(
        { success: false, message: "Cannot remove the organization owner." },
        { status: 403 }
      );
    }

    // Admin can only remove agents
    if (context.membership.role === "ADMIN" && target.role === "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admins cannot remove other admins." },
        { status: 403 }
      );
    }

    await prisma.orgMember.delete({
      where: { id: memberId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: context.org.id,
        userId: context.appUser.id,
        action: "REMOVE_MEMBER",
        entity: "OrgMember",
        entityId: memberId,
        metadata: { email: target.email, role: target.role },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully.",
    });
  } catch (error) {
    console.error("[API /team DELETE] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove team member." },
      { status: 500 }
    );
  }
}
