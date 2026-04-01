import { prisma } from "@/lib/prisma";
import OrdersTable from "@/components/orders/OrdersTable";
import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import type { SerializedOrder } from "@/components/orders/OrdersTable";

export const metadata: Metadata = {
  title: "Orders",
};

// ─────────────────────────────────────────────
// Data fetcher — direct Prisma (Server Component)
// Items are flattened so the Client Component
// (OrdersTable) can render without extra nesting.
// ─────────────────────────────────────────────

async function getOrders(): Promise<SerializedOrder[]> {
  const merchantId = process.env.MERCHANT_ID;

  const orders = await prisma.order.findMany({
    where: merchantId ? { merchantId } : undefined,
    include: {
      customer: true,
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Serialize all Decimal / Date fields AND flatten item.product.name
  // to productName so the shape matches SerializedOrder in OrdersTable.
  return orders.map((order) => ({
    id: order.id,
    shortId: order.id.slice(0, 8).toUpperCase(),
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    customer: {
      name: order.customer.name,
      waId: order.customer.waId,
    },
    items: order.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      priceAtTime: Number(item.priceAtTime),
    })),
  }));
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length > 0
              ? `${orders.length} total orders — filter and search below.`
              : "No orders yet. They will appear here once customers start buying."}
          </p>
        </div>

        {/* Total count pill */}
        <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium sm:flex">
          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{orders.length} Orders</span>
        </div>
      </div>

      {/* OrdersTable is a Client Component — receives pre-serialized data */}
      <OrdersTable orders={orders} />
    </div>
  );
}
