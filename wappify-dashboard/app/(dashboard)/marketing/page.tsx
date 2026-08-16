import { prisma } from "@/lib/prisma";
import { getRequiredOrg } from "@/lib/auth-utils";
import { ModuleOverview } from "@/components/modules/ModuleOverview";
import { getModuleByKey } from "@/modules/platform/module-config";

export const metadata = { title: "Marketing" };

export default async function MarketingOverviewPage() {
  const org = await getRequiredOrg();
  const [contacts, outboundMessages, activeRules] = await Promise.all([
    prisma.contact.count({ where: { orgId: org.id } }),
    prisma.message.count({ where: { orgId: org.id, direction: "OUTBOUND" } }),
    prisma.automationRule.count({ where: { orgId: org.id, isActive: true } }),
  ]);
  const productModule = getModuleByKey("marketing")!;

  return (
    <ModuleOverview
      module={productModule}
      metrics={[
        { label: "Audience", value: contacts.toString(), hint: "contacts available to reach" },
        { label: "Messages sent", value: outboundMessages.toString(), hint: "across WhatsApp" },
        { label: "Active automations", value: activeRules.toString(), hint: "supporting customer journeys" },
      ]}
      nextSteps={[
        { title: "Send a broadcast", description: "Reach a selected set of WhatsApp contacts.", href: "/broadcast" },
        { title: "Review your audience", description: "Search and organize contacts before your next campaign.", href: "/contacts" },
        { title: "Configure a response rule", description: "Automate campaign replies and handoffs.", href: "/automation" },
      ]}
    />
  );
}
