"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ShoppingCart,
  Truck,
  PackageCheck,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SerializedOrder {
  id: string;
  shortId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  customer: {
    name: string | null;
    waId: string;
  };
  items: {
    productName: string;
    quantity: number;
    priceAtTime: number;
  }[];
}

type SortField = "createdAt" | "totalAmount" | "status" | "customer";
type SortDirection = "asc" | "desc";

const STATUS_TABS = [
  { label: "All",       value: "ALL" },
  { label: "Pending",   value: "PENDING" },
  { label: "Paid",      value: "PAID" },
  { label: "Shipped",   value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─────────────────────────────────────────────
// Sort icon sub-component
// ─────────────────────────────────────────────

function SortIcon({
  field,
  activeField,
  direction,
}: {
  field: SortField;
  activeField: SortField;
  direction: SortDirection;
}) {
  if (field !== activeField) {
    return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/50" />;
  }
  return direction === "asc"
    ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-primary" />;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Status action config
// ─────────────────────────────────────────────

const STATUS_ACTIONS: Record<string, { label: string; newStatus: string; icon: typeof Truck; variant: "default" | "outline" | "destructive" }[]> = {
  PAID: [
    { label: "Mark Shipped", newStatus: "SHIPPED", icon: Truck, variant: "default" },
    { label: "Cancel", newStatus: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  SHIPPED: [
    { label: "Mark Delivered", newStatus: "DELIVERED", icon: PackageCheck, variant: "default" },
    { label: "Cancel", newStatus: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  PENDING: [
    { label: "Cancel", newStatus: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
};

export default function OrdersTable({ orders: initialOrders }: { orders: SerializedOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery]   = useState("");
  const [sortField, setSortField]       = useState<SortField>("createdAt");
  const [sortDir, setSortDir]           = useState<SortDirection>("desc");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // ── Update order status ────────────────────
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to update order status.");
        return;
      }

      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o,
        ),
      );
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  }, []);

  // ── Counts per status tab ──────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    for (const order of orders) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  // ── Filter ─────────────────────────────────
  const filtered = useMemo(() => {
    let result = orders;

    // Status filter
    if (activeStatus !== "ALL") {
      result = result.filter((o) => o.status === activeStatus);
    }

    // Search filter (order ID, customer name, phone, product name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.shortId.toLowerCase().includes(q) ||
          (o.customer.name ?? "").toLowerCase().includes(q) ||
          o.customer.waId.includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, activeStatus, searchQuery]);

  // ── Sort ───────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "totalAmount":
          comparison = a.totalAmount - b.totalAmount;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "customer":
          comparison = (a.customer.name ?? "").localeCompare(
            b.customer.name ?? ""
          );
          break;
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortField, sortDir]);

  // ── Sort toggle ────────────────────────────
  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Filter Bar ──────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.value] ?? 0;
            const isActive = activeStatus === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveStatus(tab.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background text-foreground"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search order, customer, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────── */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No orders found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : `No ${activeStatus !== "ALL" ? activeStatus.toLowerCase() : ""} orders yet.`}
            </p>
            {(searchQuery || activeStatus !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs h-8"
                onClick={() => {
                  setSearchQuery("");
                  setActiveStatus("ALL");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 w-[120px]">Order ID</TableHead>

                {/* Sortable: Customer */}
                <TableHead>
                  <button
                    onClick={() => toggleSort("customer")}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Customer
                    <SortIcon field="customer" activeField={sortField} direction={sortDir} />
                  </button>
                </TableHead>

                <TableHead className="hidden md:table-cell">Items</TableHead>

                {/* Sortable: Amount */}
                <TableHead className="text-right">
                  <button
                    onClick={() => toggleSort("totalAmount")}
                    className="flex items-center ml-auto text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Amount
                    <SortIcon field="totalAmount" activeField={sortField} direction={sortDir} />
                  </button>
                </TableHead>

                {/* Sortable: Status */}
                <TableHead>
                  <button
                    onClick={() => toggleSort("status")}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Status
                    <SortIcon field="status" activeField={sortField} direction={sortDir} />
                  </button>
                </TableHead>

                <TableHead className="hidden lg:table-cell">
                  Payment ID
                </TableHead>

                {/* Sortable: Date */}
                <TableHead className="hidden sm:table-cell">
                  <button
                    onClick={() => toggleSort("createdAt")}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Date
                    <SortIcon field="createdAt" activeField={sortField} direction={sortDir} />
                  </button>
                </TableHead>

                {/* Actions */}
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sorted.map((order) => (
                <TableRow key={order.id} className="group">

                  {/* Order ID */}
                  <TableCell className="pl-6">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      #{order.shortId}
                    </span>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate max-w-[140px]">
                        {order.customer.name ?? (
                          <span className="text-muted-foreground italic">Unknown</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        +{order.customer.waId}
                      </span>
                    </div>
                  </TableCell>

                  {/* Items */}
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col gap-0.5 max-w-[200px]">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="text-xs text-muted-foreground truncate">
                          {item.quantity}× {item.productName}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{order.items.length - 2} more
                        </span>
                      )}
                      {order.items.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatAmount(order.totalAmount)}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>

                  {/* Payment ID */}
                  <TableCell className="hidden lg:table-cell">
                    {order.razorpayPaymentId ? (
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
                        {order.razorpayPaymentId}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">
                        {formatDate(order.createdAt)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(order.createdAt)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="pr-6 text-right">
                    {STATUS_ACTIONS[order.status] ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {STATUS_ACTIONS[order.status].map((action) => {
                          const Icon = action.icon;
                          const isLoading = updatingOrderId === order.id;
                          return (
                            <Button
                              key={action.newStatus}
                              variant={action.variant}
                              size="sm"
                              className="h-7 text-[11px] px-2.5 gap-1"
                              disabled={isLoading}
                              onClick={() =>
                                updateOrderStatus(order.id, action.newStatus)
                              }
                            >
                              {isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Icon className="h-3 w-3" />
                              )}
                              {action.label}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {order.status === "DELIVERED" ? "✅ Complete" : order.status === "CANCELLED" ? "Cancelled" : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Footer: result count ─────────────── */}
      {sorted.length > 0 && (
        <p className="text-xs text-muted-foreground text-right tabular-nums">
          Showing{" "}
          <span className="font-semibold text-foreground">{sorted.length}</span>
          {" "}of{" "}
          <span className="font-semibold text-foreground">{orders.length}</span>{" "}
          orders
        </p>
      )}
    </div>
  );
}
