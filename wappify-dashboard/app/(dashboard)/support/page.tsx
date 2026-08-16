import { prisma } from "@/lib/prisma";
import { getRequiredOrg } from "@/lib/auth-utils";
import { ModuleOverview } from "@/components/modules/ModuleOverview";
import { getModuleByKey } from "@/modules/platform/module-config";

export const metadata = { title: "Customer Support" };

export default async function SupportOverviewPage() {
  const org = await getRequiredOrg();
  const [open, assigned, resolved] = await Promise.all([
    prisma.conversation.count({ where: { orgId: org.id, status: "OPEN" } }),
    prisma.conversation.count({ where: { orgId: org.id, status: "ASSIGNED" } }),
    prisma.conversation.count({ where: { orgId: org.id, status: "RESOLVED" } }),
  ]);
  const productModule = getModuleByKey("support")!;

  return (
    <ModuleOverview
      module={productModule}
      metrics={[
        { label: "Open", value: open.toString(), hint: "conversations awaiting a response" },
        { label: "Assigned", value: assigned.toString(), hint: "owned by your team" },
        { label: "Resolved", value: resolved.toString(), hint: "customer conversations completed" },
      ]}
      nextSteps={[
        { title: "Open shared inbox", description: "Reply, assign, escalate, and resolve conversations.", href: "/inbox" },
        { title: "Manage agents", description: "Invite teammates with the right level of access.", href: "/team" },
        { title: "Configure AI handoff", description: "Define when an AI reply should become a human conversation.", href: "/automation" },
      ]}
    />
  );
}
