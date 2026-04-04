"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Phone,
  ShoppingCart,
  IndianRupee,
  Calendar,
  ChevronRight,
  Users,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CustomerDetailDrawer from "./CustomerDetailDrawer";
import type { CustomerDetail } from "./CustomerDetailDrawer";

// ─────────────────────────────────────────────
// Types (serialized from server)
// ─────────────────────────────────────────────

export interface SerializedCustomer {
  id: string;
  waId: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: string | null;
  orders: {
    id: string;
    shortId: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: { productName: string; quantity: number; priceAtTime: number }[];
  }[];
  chatMessages: {
    id: string;
    sender: string;
    message: string;
    createdAt: string;
  }[];
}

// ─────────────────────────────────────────────
// Sort options
// ─────────────────────────────────────────────

type SortKey = "recent" | "orders" | "spent" | "name";

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function CustomerList({ customers }: { customers: SerializedCustomer[] }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = [...customers];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name?.toLowerCase().includes(q)) ||
          c.waId.includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "recent":
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "orders":
        list.sort((a, b) => b.totalOrders - a.totalOrders);
        break;
      case "spent":
        list.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case "name":
        list.sort((a, b) => (a.name || "zzz").localeCompare(b.name || "zzz"));
        break;
    }

    return list;
  }, [customers, search, sortBy]);

  const openCustomer = (c: SerializedCustomer) => {
    setSelectedCustomer(c);
    setDrawerOpen(true);
  };

  // Aggregate stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);

  // Activity status helper
  const getActivityStatus = (lastDate: string | null) => {
    if (!lastDate) return { label: "New", color: "bg-blue-100 text-blue-700" };
    const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
    if (daysSince <= 30) return { label: "Recent", color: "bg-amber-100 text-amber-700" };
    return { label: "Inactive", color: "bg-gray-100 text-gray-600" };
  };

  return (
    <>
      {/* Top-Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCustomers}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Customers</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">₹{totalRevenue.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
          </div>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or WhatsApp number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-card pl-10 pr-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-xl border bg-card px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="orders">Most Orders</option>
            <option value="spent">Highest Spend</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Customer Cards / Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            {search ? "No customers match your search." : "No customers yet."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search term." : "Customers will appear here once they interact on WhatsApp."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_120px_100px_40px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b bg-muted/30">
            <span>Customer</span>
            <span className="text-right">Orders</span>
            <span className="text-right">Total Spent</span>
            <span className="text-right">Last Order</span>
            <span className="text-center">Status</span>
            <span></span>
          </div>

          {/* Rows */}
          {filtered.map((customer) => {
            const displayName = customer.name || "Unknown";
            const initials = displayName.substring(0, 2).toUpperCase();
            const status = getActivityStatus(customer.lastOrderDate);

            return (
              <button
                key={customer.id}
                onClick={() => openCustomer(customer)}
                className="w-full grid grid-cols-1 md:grid-cols-[1fr_120px_120px_120px_100px_40px] gap-2 md:gap-4 items-center px-5 py-4 text-left border-b last:border-b-0 hover:bg-muted/30 transition-colors group"
              >
                {/* Customer Info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      +{customer.waId}
                    </p>
                  </div>
                </div>

                {/* Orders count */}
                <div className="text-right">
                  <span className="text-sm font-bold">{customer.totalOrders}</span>
                  <span className="text-xs text-muted-foreground md:hidden ml-1">orders</span>
                </div>

                {/* Total Spent */}
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-600">
                    ₹{customer.totalSpent.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Last Order */}
                <div className="text-right text-xs text-muted-foreground">
                  {customer.lastOrderDate
                    ? new Date(customer.lastOrderDate).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })
                    : "—"}
                </div>

                {/* Status */}
                <div className="text-center">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    status.color
                  )}>
                    {status.label}
                  </span>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex justify-end">
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
