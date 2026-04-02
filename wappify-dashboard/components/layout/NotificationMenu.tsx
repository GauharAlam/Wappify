"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      {/* Notification Bell Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
        <span className="sr-only">Notifications</span>
      </Button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-md border bg-card text-card-foreground shadow-md animate-in fade-in-80 zoom-in-95 z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <p className="text-sm font-semibold">Notifications</p>
            <button 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-1">
            {/* Example Notification Item */}
            <div className="flex items-start gap-3 rounded-sm p-3 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">Welcome to Wappify!</p>
                <p className="text-xs text-muted-foreground">
                  Your workspace is ready. Start by adding products to your catalog.
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Just now</p>
              </div>
            </div>
            
             {/* Example Notification Item */}
             <div className="flex items-start gap-3 rounded-sm p-3 hover:bg-muted transition-colors cursor-pointer mt-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">Database Synced</p>
                <p className="text-xs text-muted-foreground">
                  Meta servers have properly verified your WhatsApp webhooks.
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">2 hours ago</p>
              </div>
            </div>
          </div>
          
          <div className="border-t p-2">
            <button
              className="w-full text-center text-xs font-medium text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
