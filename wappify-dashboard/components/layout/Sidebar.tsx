"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  MessageSquare,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────

const NAV_ITEMS = [
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
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const [merchantName, setMerchantName] = useState("StyleHouse India");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.name) {
          setMerchantName(json.data.name);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* ── Logo ────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
          <MessageSquare className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">Wappify</span>
          <span className="text-[10px] font-medium text-muted-foreground">
            Commerce Dashboard
          </span>
        </div>
      </div>

      {/* ── Navigation ──────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* Section label */}
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>

        {NAV_ITEMS.map((item) => {
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
        })}
      </nav>

      {/* ── Merchant badge ───────────────────── */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{merchantName}</p>
            <p className="text-[10px] text-muted-foreground">Pro Plan · Active</p>
          </div>

          {/* Online dot */}
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 ring-2 ring-background" />
        </div>
      </div>
    </aside>
  );
}
