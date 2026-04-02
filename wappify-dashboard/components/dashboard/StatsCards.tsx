import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IndianRupee,
  ShoppingCart,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRequiredMerchantId } from "@/lib/auth-utils";

// ─────────────────────────────────────────────
// Data fetching (runs on the server)
// ─────────────────────────────────────────────

async function getDashboardStats() {
  const merchantId = await getRequiredMerchantId();

  if (!merchantId) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      paidOrdersCount: 0,
      pendingOrders: 0,
      totalCustomers: 0,
    };
  }

  const [allOrders, paidOrders, pendingCount, totalCustomers] =
    await Promise.all([
      prisma.order.count({ where: { merchantId } }),
      prisma.order.findMany({
        where: { merchantId, status: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.order.count({ where: { merchantId, status: "PENDING" } }),
      prisma.customer.count({
        where: { orders: { some: { merchantId } } }
      }),
    ]);

  const totalRevenue = paidOrders.reduce(
    (sum: number, order: { totalAmount: any }) => sum + Number(order.totalAmount),
    0
  );

  return {
    totalOrders: allOrders,
    totalRevenue,
    paidOrdersCount: paidOrders.length,
    pendingOrders: pendingCount,
    totalCustomers,
  };
}

// ─────────────────────────────────────────────
// Sub-component: single KPI card
// ─────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconClassName: string;
  bgClassName: string;
  trend?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  bgClassName,
  trend,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("rounded-lg p-2", bgClassName)}>
          <Icon className={cn("h-4 w-4", iconClassName)} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>

        <div className="mt-1 flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && (
            <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
              <TrendingUp className="h-2.5 w-2.5" />
              {trend}
            </span>
          )}
        </div>
      </CardContent>

      {/* Decorative gradient blob */}
      <div
        className={cn(
          "pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl",
          bgClassName
        )}
      />
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main export: Server Component
// ─────────────────────────────────────────────

export default async function StatsCards() {
  const stats = await getDashboardStats();

  const cards: StatCardProps[] = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      subtitle: `From ${stats.paidOrdersCount} paid orders`,
      icon: IndianRupee,
      iconClassName: "text-green-600",
      bgClassName: "bg-green-100",
      trend: "+12%",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      subtitle: "All time across all channels",
      icon: ShoppingCart,
      iconClassName: "text-blue-600",
      bgClassName: "bg-blue-100",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      subtitle: "Awaiting payment confirmation",
      icon: Clock,
      iconClassName: "text-orange-600",
      bgClassName: "bg-orange-100",
    },
    {
      title: "Customers",
      value: stats.totalCustomers,
      subtitle: "Unique WhatsApp users",
      icon: Users,
      iconClassName: "text-purple-600",
      bgClassName: "bg-purple-100",
      trend: "+5%",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
