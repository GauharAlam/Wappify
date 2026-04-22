"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface UserMenuProps {
  initials: string;
  name: string;
  email?: string;
}

export default function UserMenu({ initials, name, email }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        <span className="text-xs font-bold text-primary uppercase select-none pointer-events-none">
          {initials}
        </span>
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-card text-card-foreground shadow-md animate-in fade-in-80 zoom-in-95 z-50">
          <div className="p-3 border-b">
            <p className="text-sm font-medium leading-none">{name}</p>
            {email && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {email}
              </p>
            )}
          </div>
          
          <div className="p-1">
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted focus:bg-muted outline-none transition-colors"
              onClick={() => {
                setIsOpen(false);
                // Optionally route to settings
                // router.push("/settings") 
              }}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </button>
          </div>

          <div className="border-t p-1">
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 outline-none transition-colors"
              onClick={() => signOut({ redirectUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
