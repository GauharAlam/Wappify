import { prisma } from "@/lib/prisma";
import { getRequiredOrg } from "@/lib/auth-utils";
import { ModuleOverview } from "@/components/modules/ModuleOverview";
import { getModuleByKey } from "@/modules/platform/module-config";

export const metadata = { title: "Commerce" };

export default async function CommerceOverviewPage() {
  const org = await getRequiredOrg();
  const [products, orders, paidOrders] = await Promise.all([
    prisma.product.count({ where: { orgId: org.id, isActive: true } }),
    prisma.order.count({ where: { orgId: org.id } }),
    prisma.order.count({ where: { orgId: org.id, status: "PAID" } }),
  ]);
  const productModule = getModuleByKey("commerce")!;

  return (
    <ModuleOverview
      module={productModule}
      metrics={[
        { label: "Active products", value: products.toString(), hint: "available in your WhatsApp catalog" },
        { label: "Orders", value: orders.toString(), hint: "all-time orders" },
        { label: "Paid orders", value: paidOrders.toString(), hint: "payments successfully tracked" },
      ]}
      nextSteps={[
        { title: "Manage products", description: "Keep product details and stock current.", href: "/products" },
        { title: "Review orders", description: "Track customer purchases and payment status.", href: "/orders" },
        { title: "Open customer records", description: "See the people behind every purchase.", href: "/contacts" },
      ]}
    />
  );
}
