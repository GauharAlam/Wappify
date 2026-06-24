import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequiredOrgId, requireRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const orgId = await getRequiredOrgId();

    const tags = await prisma.tag.findMany({
      where: { orgId },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: tags });
  } catch (error: any) {
    console.error("[GET /api/tags]", error);
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
    const { name, color } = body;

    const tag = await prisma.tag.create({
      data: {
        orgId,
        name,
        color: color || "#6366f1"
      }
    });

    return NextResponse.json({ success: true, data: tag });
  } catch (error: any) {
    console.error("[POST /api/tags]", error);
    // Handle unique constraint failure
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A tag with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const orgId = await getRequiredOrgId();
    await requireRole("OWNER", "ADMIN");
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing tag id" }, { status: 400 });
    }

    await prisma.tag.delete({
      where: { id, orgId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/tags]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
