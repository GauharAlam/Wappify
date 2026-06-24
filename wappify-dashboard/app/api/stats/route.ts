import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getAuthContext();
  const orgId = context?.org?.id;

  if (!orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    const [totalOrders, paidOrders, pendingOrders, totalCustomers] =
      await Promise.all([
        prisma.order.count({
          where: orgId ? { orgId } : undefined,
        }),
        prisma.order.findMany({
          where: orgId
            ? { orgId, status: "PAID" }
            : { status: "PAID" },
          select: { totalAmount: true },
        }),
        prisma.order.count({
          where: orgId
            ? { orgId, status: "PENDING" }
            : { status: "PENDING" },
        }),
        prisma.contact.count({
          where: { orgId },
        }),
      ]);

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      paidOrdersCount: paidOrders.length,
      pendingOrders,
      totalCustomers,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[API /stats] Error:", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
