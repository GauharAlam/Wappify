import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

// ─────────────────────────────────────────────
// Data fetcher (runs server-side, direct Prisma)
// ─────────────────────────────────────────────

async function getRecentOrders() {
  const merchantId = process.env.MERCHANT_ID;

  const orders = await prisma.order.findMany({
    where: merchantId ? { merchantId } : undefined,
    include: {
      customer: true,
      items: {
        include: { product: true },
        take: 2,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Serialize Decimal fields before passing to client components
  return orders.map((order) => ({
    id: order.id,
    shortId: order.id.slice(0, 8).toUpperCase(),
    customerName: order.customer.name ?? "Unknown",
    customerWaId: order.customer.waId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    itemSummary:
      order.items.length > 0
        ? order.items
            .map((i) => `${i.quantity}× ${i.product.name}`)
            .join(", ")
        : "—",
    createdAt: order.createdAt.toISOString(),
  }));
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default async function RecentOrdersTable() {
  const orders = await getRecentOrders();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Latest 5 orders across all customers
          </CardDescription>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <ShoppingCart className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Orders will appear here once customers start buying via WhatsApp.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  {/* Order ID */}
                  <TableCell className="pl-6">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      #{order.shortId}
                    </span>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {order.customerName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        +{order.customerWaId}
                      </span>
                    </div>
                  </TableCell>

                  {/* Items */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
                      {order.itemSummary}
                    </span>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatAmount(order.totalAmount)}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="hidden lg:table-cell pr-6">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
