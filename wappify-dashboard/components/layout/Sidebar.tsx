"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import type { OrgRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getActiveModule, HOME_NAV, MODULES, type ModuleDefinition } from "@/modules/platform/module-config";

interface SidebarProps {
  orgName: string;
  email?: string;
  role: OrgRole;
}

type NavigationProps = Pick<SidebarProps, "role"> & { onNavigate?: () => void };

const canSeeItem = (href: string, role: OrgRole) => {
  if (href === "/team") return role === "OWNER" || role === "ADMIN";
  return true;
};

function GlobalNavItem({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ModuleDefinition["icon"];
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function WorkspaceNavigation({ role, onNavigate }: NavigationProps) {
  const pathname = usePathname();
  const activeModule = getActiveModule(pathname);
  const ActiveModuleIcon = activeModule?.icon;

  return (
    <nav className="space-y-5 px-3 py-4">
      <div>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
        <GlobalNavItem {...HOME_NAV} active={pathname === "/dashboard"} onNavigate={onNavigate} />
      </div>

      <div>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Products</p>
        <div className="space-y-0.5">
          {MODULES.filter((module) => module.key !== "settings").map((module) => (
            <GlobalNavItem
              key={module.key}
              href={module.href}
              label={module.label}
              icon={module.icon}
              active={activeModule?.key === module.key}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      {activeModule && activeModule.key !== "settings" && (
        <div className="rounded-xl border bg-muted/30 p-2">
          <div className="mb-1 flex items-center gap-2 px-2 py-1.5">
            {ActiveModuleIcon && <ActiveModuleIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-xs font-semibold">{activeModule.label}</span>
          </div>
          <div className="space-y-0.5">
            {activeModule.navigation.filter((item) => canSeeItem(item.href, role)).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
                    isActive ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                  )}
                >
                  <span>{item.label}</span>
                  {item.status === "building" && <span className="text-[9px] font-medium text-muted-foreground/80">Soon</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Manage</p>
        <GlobalNavItem
          href="/settings"
          label="Settings"
          icon={MODULES.find((module) => module.key === "settings")!.icon}
          active={activeModule?.key === "settings"}
          onNavigate={onNavigate}
        />
        {activeModule?.key === "settings" && (
          <div className="mt-1 space-y-0.5 pl-3">
            {activeModule.navigation.filter((item) => canSeeItem(item.href, role)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
                  pathname === item.href ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{item.label}</span>
                {item.status === "building" && <span className="text-[9px]">Soon</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default function Sidebar({ orgName, email, role }: SidebarProps) {
  const { signOut } = useClerk();

  return (
    <aside className="hidden h-screen w-[272px] shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-16 items-center justify-between border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Wappify" width={32} height={32} className="shrink-0 rounded-lg" />
          <span className="text-base font-semibold tracking-tight">Wappify</span>
        </Link>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkspaceNavigation role={role} />
      </div>

      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {orgName.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{orgName}</p>
            <p className="truncate text-[10px] text-muted-foreground">{email || "Current workspace"}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
