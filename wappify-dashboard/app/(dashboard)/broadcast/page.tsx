import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getRequiredMerchant } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { MessageSquare, Users } from "lucide-react";
import BroadcastUI from "@/components/dashboard/BroadcastUI";

export const metadata: Metadata = {
  title: "Broadcasts",
};

export default async function BroadcastPage() {
  const merchant = await getRequiredMerchant();

  // ── 1. Fetch Customers ────────────────────
  // We fetch unique customers associated with this merchant's orders,
  // or all customers if we want to allow broader reach.
  // For now, let's fetch all customers from the platform database
  // related to this merchant (or simply all customers globally if it's an early-stage SaaS).
  // Ideally, we'd have a Merchant-Customer join table, but for now
  // we'll fetch all unique customers.
  const customers = await prisma.customer.findMany({
    where: {
      orders: {
        some: { merchantId: merchant.id },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return (
    <div className="space-y-6 h-full pb-10">
      {/* ── Page Header ────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Engagement & Broadcasts</h1>
          <p className="text-sm text-neutral-500">
            Send bulk marketing alerts and product launches to your audience.
          </p>
        </div>

        <div className="hidden items-center gap-4 rounded-full border bg-neutral-50/50 px-4 py-2 text-xs font-semibold sm:flex border-neutral-100">
            <div className="flex items-center gap-1.5 border-r pr-4 border-neutral-200">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-neutral-900">{customers.length}</span>
                <span className="text-neutral-400 font-normal uppercase tracking-tighter">Total Customers</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-neutral-900">Meta API Live</span>
            </div>
        </div>
      </div>

      <div className="mt-8">
        <BroadcastUI customers={customers} />
      </div>
    </div>
  );
}
