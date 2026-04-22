import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

// Middleware to ensure user is an ADMIN
const requireAdmin = async () => {
  const context = await getAuthContext();
  if (!context?.appUser?.id) return null;
  if (context.appUser.role !== "ADMIN") return null;
  return context.appUser;
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "global" },
    });

    return NextResponse.json({ success: true, settings: settings || { adminUpiId: null } });
  } catch (error: any) {
    console.error("[API /admin/settings GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { adminUpiId } = await req.json();

    const updated = await prisma.platformSettings.upsert({
      where: { id: "global" },
      update: { adminUpiId: adminUpiId || null },
      create: { 
        id: "global",
        adminUpiId: adminUpiId || null 
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("[API /admin/settings PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
