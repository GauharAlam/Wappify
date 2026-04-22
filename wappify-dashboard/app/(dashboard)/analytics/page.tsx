import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getRequiredMerchant } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { TrendingUp, Users, ShoppingBag, IndianRupee } from "lucide-react";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  const merchant = await getRequiredMerchant();

  // ── 1. Fetch Data ─────────────────────────
  const orders = await prisma.order.findMany({
    where: { merchantId: merchant.id, status: "PAID" },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  const totalCustomers = await prisma.customer.count({
    where: { orders: { some: { merchantId: merchant.id } } },
  });

  // ── 2. Aggregations ────────────────────────
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

  // ── 3. Chart Data (Last 30 Days) ───────────
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, "MMM dd");
    const dayOrders = orders.filter(
      (o) => format(o.createdAt, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    const revenue = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { name: dateStr, revenue };
  });

  // ── 4. Top Products ───────────────────────
  const productSales: Record<string, { name: string; sales: number }> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const pid = item.productId;
      if (!productSales[pid]) {
        productSales[pid] = { name: item.product.name, sales: 0 };
      }
      productSales[pid].sales += item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Advanced Analytics</h1>
        <p className="text-sm text-neutral-500">
          Tracking your store&apos;s growth and customer behavior across WhatsApp.
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", val: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Orders", val: totalOrders.toString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Avg. Order Value", val: `₹${Math.round(avgOrderValue).toLocaleString()}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Conversion Rate", val: `${conversionRate.toFixed(1)}%`, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm border-neutral-100">
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-5 w-5", kpi.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{kpi.label}</p>
                  <h3 className="text-2xl font-bold mt-1 tracking-tight">{kpi.val}</h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Charts (Client Component) ─ */}
      <AnalyticsCharts lineData={last30Days} barData={topProducts} />
    </div>
  );
}
