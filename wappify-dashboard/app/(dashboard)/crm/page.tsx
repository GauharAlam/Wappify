import { prisma } from "@/lib/prisma";
import { getRequiredOrg } from "@/lib/auth-utils";
import { ModuleOverview } from "@/components/modules/ModuleOverview";
import { getModuleByKey } from "@/modules/platform/module-config";

export const metadata = { title: "CRM" };

export default async function CrmOverviewPage() {
  const org = await getRequiredOrg();
  const [contacts, conversations, orders] = await Promise.all([
    prisma.contact.count({ where: { orgId: org.id } }),
    prisma.conversation.count({ where: { orgId: org.id } }),
    prisma.order.count({ where: { orgId: org.id } }),
  ]);
  const productModule = getModuleByKey("crm")!;

  return (
    <ModuleOverview
      module={productModule}
      metrics={[
        { label: "Contacts", value: contacts.toString(), hint: "people in your customer graph" },
        { label: "Conversations", value: conversations.toString(), hint: "relationship history captured" },
        { label: "Orders", value: orders.toString(), hint: "commerce activity connected to contacts" },
      ]}
      nextSteps={[
        { title: "Explore contacts", description: "View customer profiles and activity history.", href: "/contacts" },
        { title: "Review conversations", description: "Use recent interactions as customer context.", href: "/inbox" },
        { title: "Plan your pipeline", description: "Leads and deals are the next CRM foundation.", href: "/crm/pipeline" },
      ]}
    />
  );
}
