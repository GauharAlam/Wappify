import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredOrgId, requireRole } from "@/lib/auth-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getRequiredOrgId();
    const resolvedParams = await params;
    const ruleId = resolvedParams.id;

    const rule = await prisma.automationRule.findUnique({
      where: { id: ruleId, orgId },
      include: { tag: true }
    });

    if (!rule) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    console.error("[GET /api/automation/[id]]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getRequiredOrgId();
    await requireRole("OWNER", "ADMIN");
    
    const resolvedParams = await params;
    const ruleId = resolvedParams.id;
    const body = await request.json();

    const rule = await prisma.automationRule.update({
      where: { id: ruleId, orgId },
      data: { ...body },
      include: { tag: true }
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    console.error("[PATCH /api/automation/[id]]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getRequiredOrgId();
    await requireRole("OWNER", "ADMIN");
    
    const resolvedParams = await params;
    const ruleId = resolvedParams.id;

    await prisma.automationRule.delete({
      where: { id: ruleId, orgId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/automation/[id]]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
