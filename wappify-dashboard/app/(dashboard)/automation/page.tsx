import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getRequiredOrg } from "@/lib/auth-utils";
import AutomationRuleList from "@/components/automation/AutomationRuleList";

export const metadata: Metadata = {
  title: "Automation Rules — Wappify",
  description: "Configure how your bot responds to incoming messages.",
};

export default async function AutomationPage() {
  const org = await getRequiredOrg();

  const rules = await prisma.automationRule.findMany({
    where: { orgId: org.id },
    orderBy: { priority: "asc" },
    include: { tag: true },
  });

  const tags = await prisma.tag.findMany({
    where: { orgId: org.id },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <AutomationRuleList initialRules={rules} availableTags={tags} />
    </div>
  );
}
