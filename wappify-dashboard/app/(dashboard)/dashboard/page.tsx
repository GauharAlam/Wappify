import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  ShoppingCart,
  IndianRupee,
  Clock,
  Users,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// ─────────────────────────────────────────────
// Data fetchers — run in parallel via Promise.all
// Direct Prisma calls in Server Components are
// preferred over fetch("/api/...") to avoid the
// extra network hop and serialization overhead.
// ─────────────────────────────────────────────

async function getStats(merchantId: string) {


  const [totalOrders, paidOrders, pendingOrders, totalCustomers, merchant] =
    await Promise.all([
      prisma.order.count({ where: { merchantId } }),
      prisma.order.findMany({
        where: { merchantId, status: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.order.count({ where: { merchantId, status: "PENDING" } }),
      prisma.customer.count(),
      merchantId
        ? prisma.merchant.findUnique({
            where: { id: merchantId },
            select: { name: true },
          })
        : Promise.resolve(null),
    ]);

  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    totalCustomers,
    paidOrdersCount: paidOrders.length,
    merchantName: merchant?.name || "Our Store",
  };
}

async function getRecentOrders(merchantId: string) {


  const orders = await prisma.order.findMany({
    where: { merchantId },
    include: {
      customer: true,
      items: {
        include: { product: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Serialize Decimal fields to numbers before passing to client
  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    customer: {
      name: order.customer.name,
      waId: order.customer.waId,
    },
    firstItem: order.items[0]
      ? {
          productName: order.items[0].product.name,
          quantity: order.items[0].quantity,
        }
      : null,
  }));
}

// ─────────────────────────────────────────────
// Sub-components (Server, no "use client" needed)
// ─────────────────────────────────────────────

type StatsData = Awaited<ReturnType<typeof getStats>>;

function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      subtext: `${stats.paidOrdersCount} paid orders`,
      icon: IndianRupee,
      iconClass: "text-green-600",
      bgClass: "bg-green-50",
      trend: stats.totalRevenue > 0 ? "Real-time" : "No revenue yet",
      trendUp: stats.totalRevenue > 0,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      subtext: "Across all customers",
      icon: ShoppingCart,
      iconClass: "text-blue-600",
      bgClass: "bg-blue-50",
      trend: stats.totalOrders > 0 ? "Active" : "No orders yet",
      trendUp: stats.totalOrders > 0,
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      subtext: "Awaiting payment",
      icon: Clock,
      iconClass: "text-orange-600",
      bgClass: "bg-orange-50",
      trend: stats.pendingOrders > 0 ? "Needs attention" : "Everything clear",
      trendUp: stats.pendingOrders === 0,
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      subtext: "Unique WhatsApp users",
      icon: Users,
      iconClass: "text-purple-600",
      bgClass: "bg-purple-50",
      trend: stats.totalCustomers > 0 ? "Live" : "No customers yet",
      trendUp: stats.totalCustomers > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="transition-shadow hover:shadow-md border-none shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgClass}`}>
                <Icon className={`h-4 w-4 ${card.iconClass}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {card.value}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <p className="text-[10px] text-muted-foreground">
                  <span
                    className={
                      card.trendUp ? "text-green-600 font-bold" : "text-orange-600 font-bold"
                    }
                  >
                    {card.trend}
                  </span>
                  {" · "}
                  {card.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

type RecentOrder = Awaited<ReturnType<typeof getRecentOrders>>[number];

function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <CardDescription>
            Orders will appear here once customers start messaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No orders yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share your WhatsApp number with customers to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <CardDescription>
              Showing the latest {orders.length} orders across all customers.
            </CardDescription>
          </div>
          <a
            href="/orders"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all →
          </a>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                {/* Order ID */}
                <TableCell className="pl-6">
                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {order.customer.name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      +{order.customer.waId}
                    </span>
                  </div>
                </TableCell>

                {/* Product */}
                <TableCell>
                  {order.firstItem ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {order.firstItem.productName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Qty: {order.firstItem.quantity}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Amount */}
                <TableCell>
                  <span className="font-semibold">
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>

                {/* Date */}
                <TableCell className="pr-6">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.merchantId) {
    // If user has no merchant profile, redirect to onboarding or settings
    redirect("/settings");
  }

  const merchantId = session.user.merchantId;

  const [stats, recentOrders] = await Promise.all([
    getStats(merchantId),
    getRecentOrders(merchantId),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="text-foreground font-bold">{stats.merchantName}</span> 👋 — here is what is happening today in your business.
          </p>
        </div>

        {/* Live indicator */}
        <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          WhatsApp API Connected
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Recent orders table */}
      <RecentOrdersTable orders={recentOrders} />
    </div>
  );
}
