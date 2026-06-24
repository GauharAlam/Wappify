import { prisma } from "@/lib/prisma";
import ContactList from "@/components/contacts/ContactList";
import type { SerializedCustomer } from "@/components/contacts/ContactList";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getRequiredOrg } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Contacts — CRM",
  description: "View all your contacts, their order history, and chat logs.",
};

// ─────────────────────────────────────────────
// Data fetcher — direct Prisma (Server Component)
// ─────────────────────────────────────────────

async function getCustomersWithDetails(orgId: string): Promise<SerializedCustomer[]> {
  // Get all contacts for this org
  const contacts = await prisma.contact.findMany({
    where: { orgId },
    include: {
      orders: {
        where: { orgId },
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
      conversations: {
        where: { orgId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 50,
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return contacts.map((contact) => {
    const totalSpent = contact.orders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );
    const totalOrders = contact.orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    const lastOrder = contact.orders[0];
    const allMessages = contact.conversations.flatMap(c => c.messages);

    return {
      id: contact.id,
      waId: contact.waId,
      name: contact.name,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      totalOrders,
      totalSpent,
      avgOrderValue,
      lastOrderDate: lastOrder ? lastOrder.createdAt.toISOString() : null,
      orders: contact.orders.map((order) => ({
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
      chatMessages: allMessages.map((msg) => ({
        id: msg.id,
        sender: msg.direction === "INBOUND" ? "customer" : "bot",
        message: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
    };
  });

}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function ContactsPage() {
  const org = await getRequiredOrg();

  const customers = await getCustomersWithDetails(org.id);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length > 0
              ? `${customers.length} contact${customers.length !== 1 ? "s" : ""} — view order history and chat logs.`
              : "No contacts yet. They will appear here once they start buying."}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium sm:flex">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{customers.length} Contacts</span>
        </div>
      </div>

      {/* ContactList is a Client Component — receives pre-serialized data */}
      <ContactList customers={customers} />
    </div>
  );
}
