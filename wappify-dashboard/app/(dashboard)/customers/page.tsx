import { prisma } from "@/lib/prisma";
import CustomerList from "@/components/customers/CustomerList";
import type { SerializedCustomer } from "@/components/customers/CustomerList";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getRequiredMerchant } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Customers — CRM",
  description: "View all your customers, their order history, and chat logs.",
};

// ─────────────────────────────────────────────
// Data fetcher — direct Prisma (Server Component)
// ─────────────────────────────────────────────

async function getCustomersWithDetails(merchantId: string): Promise<SerializedCustomer[]> {
  // Get all customers who have orders with this merchant
  const customers = await prisma.customer.findMany({
    where: {
      orders: {
        some: { merchantId },
      },
    },
    include: {
      orders: {
        where: { merchantId },
        include: {
          items: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Also get all chat messages for these customers
  const customerWaIds = customers.map((c) => c.waId);
  const chatMessages = await prisma.chatMessage.findMany({
    where: {
      merchantId,
      customerWaId: { in: customerWaIds },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group chat messages by customerWaId
  const chatsByWaId = new Map<string, typeof chatMessages>();
  for (const msg of chatMessages) {
    const existing = chatsByWaId.get(msg.customerWaId) || [];
    existing.push(msg);
    chatsByWaId.set(msg.customerWaId, existing);
  }

  return customers.map((customer) => {
    const totalSpent = customer.orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );
    const totalOrders = customer.orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    const lastOrder = customer.orders[0]; // Already sorted desc
    const customerChats = chatsByWaId.get(customer.waId) || [];

    return {
      id: customer.id,
      waId: customer.waId,
      name: customer.name,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      totalOrders,
      totalSpent,
      avgOrderValue,
      lastOrderDate: lastOrder ? lastOrder.createdAt.toISOString() : null,
      orders: customer.orders.map((order) => ({
        id: order.id,
        shortId: order.id.slice(0, 8).toUpperCase(),
        status: order.status,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          priceAtTime: Number(item.priceAtTime),
        })),
      })),
      chatMessages: customerChats.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        message: msg.message,
        createdAt: msg.createdAt.toISOString(),
      })),
    };
  });
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function CustomersPage() {
  const merchant = await getRequiredMerchant();

  const customers = await getCustomersWithDetails(merchant.id);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length > 0
              ? `${customers.length} customer${customers.length !== 1 ? "s" : ""} — view order history and chat logs.`
              : "No customers yet. They will appear here once they start buying."}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium sm:flex">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{customers.length} Customers</span>
        </div>
      </div>

      {/* CustomerList is a Client Component — receives pre-serialized data */}
      <CustomerList customers={customers} />
    </div>
  );
}
