"use client";

import { useEffect, useState } from "react";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import type { OrgRole } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getBreadcrumbs } from "@/modules/platform/module-config";
import { WorkspaceNavigation } from "./Sidebar";
import NotificationMenu from "./NotificationMenu";
import UserMenu from "./UserMenu";

interface HeaderProps {
  userName: string;
  email?: string;
  orgName: string;
  role: OrgRole;
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("wappify-theme");
    const useDarkTheme = savedTheme
      ? savedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", useDarkTheme);
    setIsDark(useDarkTheme);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("wappify-theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={isDark ? "Use light theme" : "Use dark theme"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export default function Header({ userName, email, orgName, role }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const initials = userName.substring(0, 2).toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4 sm:px-6">
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="left-0 top-0 h-dvh max-w-[290px] translate-x-0 translate-y-0 overflow-y-auto rounded-none border-y-0 border-l-0 p-0 sm:rounded-none">
          <div className="border-b px-5 py-5">
            <p className="text-sm font-semibold">{orgName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Workspace navigation</p>
          </div>
          <WorkspaceNavigation role={role} onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb} className="flex items-center gap-2">
            {index > 0 && <span className="text-muted-foreground/60">/</span>}
            <span className={index === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"}>{crumb}</span>
          </span>
        ))}
      </div>

      <div className="relative ml-auto hidden w-full max-w-xs md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search your workspace" className="h-9 bg-background pl-9 pr-12 text-xs" />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
      </div>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <ThemeToggle />
        <NotificationMenu />
        <UserMenu initials={initials} name={userName} email={email} />
      </div>
    </header>
  );
}
