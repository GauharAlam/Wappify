import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  ContactRound,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquareMore,
  Package,
  Settings2,
  ShoppingBag,
  UsersRound,
  Workflow,
} from "lucide-react";

export type ModuleKey =
  | "marketing"
  | "commerce"
  | "support"
  | "crm"
  | "automation"
  | "analytics"
  | "settings";

export type ModuleNavItem = {
  label: string;
  href: string;
  status?: "live" | "building";
};

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  metricLabel: string;
  navigation: ModuleNavItem[];
};

export const MODULES: ModuleDefinition[] = [
  {
    key: "marketing",
    label: "Marketing",
    description: "Create targeted WhatsApp campaigns and grow your audience.",
    href: "/marketing",
    icon: Megaphone,
    accent: "bg-violet-500",
    metricLabel: "Campaigns & broadcasts",
    navigation: [
      { label: "Overview", href: "/marketing" },
      { label: "Campaigns", href: "/marketing/campaigns", status: "building" },
      { label: "Broadcasts", href: "/broadcast", status: "live" },
      { label: "Audience", href: "/contacts", status: "live" },
      { label: "Templates", href: "/marketing/templates", status: "building" },
      { label: "Flows", href: "/marketing/flows", status: "building" },
      { label: "Reports", href: "/marketing/reports", status: "building" },
    ],
  },
  {
    key: "commerce",
    label: "Commerce",
    description: "Manage catalog, orders, payments, and customer purchases.",
    href: "/commerce",
    icon: ShoppingBag,
    accent: "bg-emerald-500",
    metricLabel: "Orders & catalog",
    navigation: [
      { label: "Overview", href: "/commerce" },
      { label: "Products", href: "/products", status: "live" },
      { label: "Orders", href: "/orders", status: "live" },
      { label: "Customers", href: "/contacts", status: "live" },
      { label: "Inventory", href: "/commerce/inventory", status: "building" },
      { label: "Coupons", href: "/commerce/coupons", status: "building" },
      { label: "Payments", href: "/commerce/payments", status: "building" },
      { label: "Shipping", href: "/commerce/shipping", status: "building" },
    ],
  },
  {
    key: "support",
    label: "Customer Support",
    description: "Resolve customer conversations with one shared team inbox.",
    href: "/support",
    icon: MessageSquareMore,
    accent: "bg-sky-500",
    metricLabel: "Inbox & tickets",
    navigation: [
      { label: "Overview", href: "/support" },
      { label: "Inbox", href: "/inbox", status: "live" },
      { label: "Tickets", href: "/support/tickets", status: "building" },
      { label: "Knowledge Base", href: "/support/knowledge-base", status: "building" },
      { label: "Quick Replies", href: "/support/quick-replies", status: "building" },
      { label: "Agents", href: "/team", status: "live" },
      { label: "Reports", href: "/support/reports", status: "building" },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    description: "Turn WhatsApp conversations into lasting customer relationships.",
    href: "/crm",
    icon: UsersRound,
    accent: "bg-amber-500",
    metricLabel: "Contacts & deals",
    navigation: [
      { label: "Overview", href: "/crm" },
      { label: "Leads", href: "/crm/leads", status: "building" },
      { label: "Contacts", href: "/contacts", status: "live" },
      { label: "Companies", href: "/crm/companies", status: "building" },
      { label: "Deals", href: "/crm/deals", status: "building" },
      { label: "Pipeline", href: "/crm/pipeline", status: "building" },
      { label: "Activities", href: "/crm/activities", status: "building" },
    ],
  },
  {
    key: "automation",
    label: "AI Automation",
    description: "Automate customer journeys, agent handoffs, and operational work.",
    href: "/automation",
    icon: Bot,
    accent: "bg-fuchsia-500",
    metricLabel: "Rules & AI assistant",
    navigation: [
      { label: "Overview", href: "/automation" },
      { label: "Workflow Builder", href: "/automation/workflows", status: "building" },
      { label: "Triggers", href: "/automation/triggers", status: "building" },
      { label: "Actions", href: "/automation/actions", status: "building" },
      { label: "Integrations", href: "/automation/integrations", status: "building" },
      { label: "Execution Logs", href: "/automation/logs", status: "building" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Understand revenue, engagement, and customer growth.",
    href: "/analytics",
    icon: BarChart3,
    accent: "bg-indigo-500",
    metricLabel: "Revenue & insights",
    navigation: [
      { label: "Overview", href: "/analytics", status: "live" },
      { label: "Revenue", href: "/analytics/revenue", status: "building" },
      { label: "Campaigns", href: "/analytics/campaigns", status: "building" },
      { label: "Funnels", href: "/analytics/funnels", status: "building" },
      { label: "Retention", href: "/analytics/retention", status: "building" },
      { label: "Reports", href: "/analytics/reports", status: "building" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    description: "Control your workspace, team, billing, and integrations.",
    href: "/settings",
    icon: Settings2,
    accent: "bg-slate-500",
    metricLabel: "Workspace configuration",
    navigation: [
      { label: "Workspace", href: "/settings", status: "live" },
      { label: "Team", href: "/team", status: "live" },
      { label: "Billing", href: "/billing", status: "live" },
      { label: "Roles & permissions", href: "/settings/roles", status: "building" },
      { label: "API & webhooks", href: "/settings/developer", status: "building" },
      { label: "Security", href: "/settings/security", status: "building" },
    ],
  },
];

export const HOME_NAV = { label: "Home", href: "/dashboard", icon: LayoutDashboard };

const LEGACY_ROUTE_MODULES: Array<[string, ModuleKey]> = [
  ["/broadcast", "marketing"],
  ["/products", "commerce"],
  ["/orders", "commerce"],
  ["/inbox", "support"],
  ["/contacts", "crm"],
  ["/team", "settings"],
  ["/billing", "settings"],
];

export function getModuleByKey(key: string) {
  return MODULES.find((module) => module.key === key);
}

export function getActiveModule(pathname: string) {
  const moduleRoute = MODULES.find(
    (module) => pathname === module.href || pathname.startsWith(`${module.href}/`),
  );

  if (moduleRoute) return moduleRoute;

  const legacyRoute = LEGACY_ROUTE_MODULES.find(([href]) =>
    pathname === href || pathname.startsWith(`${href}/`),
  );

  return legacyRoute ? getModuleByKey(legacyRoute[1]) : undefined;
}

export function getBreadcrumbs(pathname: string) {
  if (pathname === "/dashboard") return ["Home"];

  const module = getActiveModule(pathname);
  if (!module) return ["Home"];

  const item = module.navigation.find((nav) => nav.href === pathname);
  return item && item.label !== "Overview"
    ? [module.label, item.label]
    : [module.label];
}

export const MODULE_FEATURE_ICONS = {
  campaigns: Megaphone,
  inventory: Boxes,
  tickets: FileText,
  companies: Building2,
  leads: ContactRound,
  workflows: Workflow,
  reports: BarChart3,
  default: Package,
};
