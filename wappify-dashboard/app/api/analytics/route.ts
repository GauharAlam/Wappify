import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, endOfDay } from "date-fns";

import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const merchantId = session?.user?.merchantId;

  if (!merchantId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    // ── 1. Revenue & Orders Over Last 30 Days ─────
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
    
    const ordersInPeriod = await prisma.order.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by day for charts
    const dailyStats: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < 30; i++) {
      const dateStr = startOfDay(subDays(new Date(), i)).toISOString().split('T')[0];
      dailyStats[dateStr] = { revenue: 0, orders: 0 };
    }

    ordersInPeriod.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        if (order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED") {
          dailyStats[dateStr].revenue += Number(order.totalAmount);
        }
        dailyStats[dateStr].orders += 1;
      }
    });

    const chartData = Object.entries(dailyStats)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── 2. Orders by Status ─────────────────────
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: merchantId ? { merchantId } : {},
      _count: { id: true },
    });

    const orderDistribution = statusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // ── 3. Top Products ────────────────────────
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: merchantId ? { order: { merchantId } } : {},
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProducts = await Promise.all(
      topProductsRaw.map(async (tp) => {
        const product = await prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, price: true },
        });
        return {
          name: product?.name || "Unknown Product",
          quantity: tp._sum.quantity || 0,
          revenue: (tp._sum.quantity || 0) * Number(product?.price || 0),
        };
      })
    );

    // ── 4. Summary Stats ───────────────────────
    const [totalRevenueResult, totalCustomers, paidOrdersCount] = await Promise.all([
      prisma.order.aggregate({
        where: {
          ...(merchantId ? { merchantId } : {}),
          status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.customer.count(),
      prisma.order.count({
        where: {
          ...(merchantId ? { merchantId } : {}),
          status: "PAID",
        },
      }),
    ]);

    const totalRevenue = Number(totalRevenueResult._sum.totalAmount || 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalCustomers,
        paidOrdersCount,
        aov: paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0,
      },
      chartData,
      orderDistribution,
      topProducts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    console.error("[API /analytics] Error:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
