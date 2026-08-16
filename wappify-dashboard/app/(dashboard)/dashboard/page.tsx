import Link from "next/link";
import { ArrowRight, CircleAlert, Plus } from "lucide-react";
import { ModuleLauncher } from "@/components/home/ModuleLauncher";
import { Card, CardContent } from "@/components/ui/card";
import { getRequiredDashboardContext } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import type { ModuleDefinition } from "@/modules/platform/module-config";

export const metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const { org, appUser } = await getRequiredDashboardContext();
  const [productCount, orderCount, contactCount, openConversations, activeRules, paidOrders] = await Promise.all([
    prisma.product.count({ where: { orgId: org.id } }),
    prisma.order.count({ where: { orgId: org.id } }),
    prisma.contact.count({ where: { orgId: org.id } }),
    prisma.conversation.count({ where: { orgId: org.id, status: { in: ["OPEN", "ASSIGNED"] } } }),
    prisma.automationRule.count({ where: { orgId: org.id, isActive: true } }),
    prisma.order.count({ where: { orgId: org.id, status: "PAID" } }),
  ]);

  const stats: Array<{ key: ModuleDefinition["key"]; value: string; detail: string; isLive?: boolean }> = [
    { key: "marketing", value: "Campaigns", detail: "Broadcast tools available", isLive: true },
    { key: "commerce", value: `${orderCount}`, detail: `${productCount} products in catalog`, isLive: true },
    { key: "support", value: `${openConversations}`, detail: "conversations need attention", isLive: true },
    { key: "crm", value: `${contactCount}`, detail: "customer contacts", isLive: true },
    { key: "automation", value: `${activeRules}`, detail: "active automation rules", isLive: true },
    { key: "analytics", value: `${paidOrders}`, detail: "paid orders tracked", isLive: true },
  ];

  const firstName = appUser.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{org.name} workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see you, {firstName}.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Choose a product area to focus your work. Wappify keeps campaigns, commerce, support, and automation in dedicated workspaces.</p>
        </div>
        <Link href="/products" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Your products</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Open a focused workspace.</p>
          </div>
          <span className="hidden rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground sm:block">6 workspaces</span>
        </div>
        <ModuleLauncher stats={stats} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl shadow-none lg:col-span-2">
          <CardContent className="flex min-h-36 flex-col justify-between p-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold">Keep the workspace moving</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Your current setup has {productCount} products, {contactCount} contacts, and {activeRules} active automations. Expand each module as your team is ready.</p>
            </div>
            <Link href="/settings" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary sm:mt-0">
              Workspace settings <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-200 bg-amber-50/60 shadow-none dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-5">
            <CircleAlert className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm font-semibold">New modular navigation</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">Your existing pages are still available. New sections marked “Soon” are the next build milestones.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
