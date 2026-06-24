"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  TrendingUp,
  CreditCard,
  LogOut,
  Users,
  ShieldAlert,
  MessageSquare,
  UserPlus,
  Workflow,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import type { OrgRole } from "@prisma/client";

// ─────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: "/inbox",
    label: "Inbox",
    icon: MessageSquare,
    badge: true,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/orders",
    label: "Orders",
    icon: ShoppingCart,
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: Contact,
  },
  {
    href: "/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: TrendingUp,
  },
  {
    href: "/automation",
    label: "Automation",
    icon: Workflow,
    minRole: "ADMIN" as OrgRole,
  },
  {
    href: "/team",
    label: "Team",
    icon: UserPlus,
    minRole: "ADMIN" as OrgRole,
  },
  {
    href: "/billing",
    label: "Billing",
    icon: CreditCard,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

// Role hierarchy for access control
const ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  AGENT: 1,
};

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────

interface SidebarProps {
  orgName: string;
  email?: string;
  role: OrgRole;
}

export default function Sidebar({
  orgName,
  email,
  role,
}: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const userRoleLevel = ROLE_HIERARCHY[role] || 1;

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* ── Logo ────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <Image src="/logo.svg" alt="Wappify Logo" width={36} height={36} className="rounded-xl shrink-0" />
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">Wappify</span>
          <span className="text-[10px] font-medium text-muted-foreground">
            Communication OS
          </span>
        </div>
      </div>

      {/* ── Navigation ──────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* Section label */}
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>

        {(() => {
          const items = NAV_ITEMS.filter((item) => {
            // Check role-based access
            if (item.minRole) {
              const requiredLevel = ROLE_HIERARCHY[item.minRole] || 0;
              return userRoleLevel >= requiredLevel;
            }
            return true;
          });

          // Add admin panel for platform admins
          if (role === "OWNER" || role === "ADMIN") {
            // Check if user is also a platform ADMIN
          }

          return items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                  isActive && "scale-110"
                )}
              />
              {item.label}

              {/* Active pill indicator */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
              )}
            </Link>
            );
          });
        })()}
      </nav>

      {/* ── Organization badge ───────────────────── */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-xs uppercase">
            {orgName.substring(0, 2)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{orgName}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {email || "user@wappify.com"}
            </p>
          </div>

          {/* Role badge */}
          <span className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            role === "OWNER" && "bg-amber-100 text-amber-700",
            role === "ADMIN" && "bg-blue-100 text-blue-700",
            role === "AGENT" && "bg-green-100 text-green-700",
          )}>
            {role}
          </span>
        </div>

        <button
          onClick={() => signOut({ redirectUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
