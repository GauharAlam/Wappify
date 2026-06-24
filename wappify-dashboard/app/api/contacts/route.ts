import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredOrgId, requireRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const orgId = await getRequiredOrgId();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const contacts = await prisma.contact.findMany({
      where: {
        orgId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { waId: { contains: search } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } }
              ]
            }
          : {})
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { conversations: true, orders: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    console.error("[GET /api/contacts]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const orgId = await getRequiredOrgId();
    await requireRole("OWNER", "ADMIN", "AGENT");

    const body = await request.json();
    const { name, waId, email, phone, notes } = body;

    const contact = await prisma.contact.create({
      data: {
        orgId,
        waId,
        name,
        email,
        phone,
        notes
      }
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (error: any) {
    console.error("[POST /api/contacts]", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A contact with this WhatsApp ID already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
