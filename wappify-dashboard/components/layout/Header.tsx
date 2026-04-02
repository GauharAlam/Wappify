import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import NotificationMenu from "./NotificationMenu";
import UserMenu from "./UserMenu";
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
        <NotificationMenu />

        {/* Avatar */}
        <UserMenu 
          initials={initials} 
          name={userName} 
          email={session?.user?.email || undefined} 
        />
      </div>
    </header>
  );
}
