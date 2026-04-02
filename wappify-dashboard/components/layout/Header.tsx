import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export default async function Header() {
  const session = await auth();
  const userName = session?.user?.name || "Merchant";
  const initials = userName.substring(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b bg-card flex items-center px-6 gap-4 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search orders, customers..."
            className="pl-9 bg-background h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary uppercase select-none">
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
