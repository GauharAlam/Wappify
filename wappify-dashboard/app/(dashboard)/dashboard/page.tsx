import StatsCards from "@/components/dashboard/StatsCards";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import type { Metadata } from "next";
import { getRequiredMerchant } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const merchant = await getRequiredMerchant();
  
  // ── ONBOARDING CHECK ───────────────────
  // If no merchant profile exists OR merchant hasn't connected WhatsApp/Payments,
  // we redirect them to the Zero-to-Hero onboarding experience.
  if (!merchant || !merchant.whatsappPhoneId || !merchant.razorpayKeyId) {
    redirect("/onboarding");
  }
  
  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="text-foreground font-bold">{merchant?.name || "Merchant"}</span> 👋 — here is what is happening today in your business.
          </p>
        </div>

        {/* ── Live Indicator ─────────────────── */}
        <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          WhatsApp API Connected
        </div>
      </div>

      {/* ── Stats Cards (Dynamic) ─────────── */}
      <StatsCards />

      {/* ── Recent Orders (Dynamic) ────────── */}
      <RecentOrdersTable />
    </div>
  );
}
