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
    const contactId = resolvedParams.id;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId, orgId },
      include: {
        conversations: {
          orderBy: { lastMessageAt: "desc" },
          take: 5
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: contact });
  } catch (error: any) {
    console.error("[GET /api/contacts/[id]]", error);
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
    await requireRole("OWNER", "ADMIN", "AGENT");
    
    const resolvedParams = await params;
    const contactId = resolvedParams.id;
    const body = await request.json();
    const { name, email, phone, notes } = body;

    const contact = await prisma.contact.update({
      where: { id: contactId, orgId },
      data: { name, email, phone, notes }
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (error: any) {
    console.error("[PATCH /api/contacts/[id]]", error);
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
    const contactId = resolvedParams.id;

    await prisma.contact.delete({
      where: { id: contactId, orgId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/contacts/[id]]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
