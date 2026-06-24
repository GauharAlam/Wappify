import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredOrgId, requireRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const orgId = await getRequiredOrgId();

    const rules = await prisma.automationRule.findMany({
      where: { orgId },
      orderBy: { priority: "asc" },
      include: { tag: true }
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    console.error("[GET /api/automation]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const orgId = await getRequiredOrgId();
    await requireRole("OWNER", "ADMIN");

    const body = await request.json();
    const {
      name,
      trigger,
      keywords,
      matchMode,
      action,
      responseText,
      tagId,
      priority,
      isActive
    } = body;

    const rule = await prisma.automationRule.create({
      data: {
        orgId,
        name,
        trigger,
        keywords: keywords || [],
        matchMode,
        action,
        responseText: responseText || null,
        tagId: tagId || null,
        priority: priority ?? 0,
        isActive: isActive ?? true
      },
      include: { tag: true }
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    console.error("[POST /api/automation]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const orgId = await getRequiredOrgId();
    await requireRole("OWNER", "ADMIN");

    // For bulk reordering
    const body = await request.json();
    const { updates } = body; // Array of { id, priority }

    if (Array.isArray(updates)) {
      // Execute in transaction
      await prisma.$transaction(
        updates.map((update: any) =>
          prisma.automationRule.update({
            where: { id: update.id, orgId },
            data: { priority: update.priority }
          })
        )
      );
      
      const rules = await prisma.automationRule.findMany({
        where: { orgId },
        orderBy: { priority: "asc" },
        include: { tag: true }
      });
      return NextResponse.json({ success: true, data: rules });
    }

    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  } catch (error: any) {
    console.error("[PATCH /api/automation]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
