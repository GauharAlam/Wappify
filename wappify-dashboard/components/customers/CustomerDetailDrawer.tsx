"use client";

import { useState } from "react";
import { X, Phone, Calendar, ShoppingCart, MessageSquare, IndianRupee, Package, Clock, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CustomerOrder {
  id: string;
  shortId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { productName: string; quantity: number; priceAtTime: number }[];
}

export interface ChatMsg {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
}

export interface CustomerDetail {
  id: string;
  waId: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  orders: CustomerOrder[];
  chatMessages: ChatMsg[];
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface Props {
  customer: CustomerDetail | null;
  open: boolean;
  onClose: () => void;
}

export default function CustomerDetailDrawer({ customer, open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"orders" | "chat">("orders");

  if (!customer) return null;

  const displayName = customer.name || "Unknown Customer";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-background border-l shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-sm">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-bold">{displayName}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                +{customer.waId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 border-b px-6 py-4">
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{customer.totalOrders}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Orders</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Spent</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">₹{customer.avgOrderValue.toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg. Order</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-6 border-b px-6 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            First seen: {new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last active: {new Date(customer.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            Orders ({customer.orders.length})
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "chat"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat Logs ({customer.chatMessages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "orders" ? (
            <OrdersTab orders={customer.orders} />
          ) : (
            <ChatTab messages={customer.chatMessages} customerName={displayName} />
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Orders Tab
// ─────────────────────────────────────────────

function OrdersTab({ orders }: { orders: CustomerOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground font-medium">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground">
                #{order.shortId}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  statusStyles[order.status] || "bg-gray-100 text-gray-600"
                )}
              >
                {order.status}
              </span>
            </div>
            <span className="text-sm font-bold">
              ₹{order.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-1">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.productName} × {item.quantity}</span>
                <span>₹{item.priceAtTime.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit"
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Chat Tab
// ─────────────────────────────────────────────

function ChatTab({ messages, customerName }: { messages: ChatMsg[]; customerName: string }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground font-medium">No chat messages yet</p>
        <p className="text-xs text-muted-foreground mt-1">Messages will appear here once the customer chats on WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isBot = msg.sender === "bot";
        return (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              isBot ? "justify-start" : "justify-end"
            )}
          >
            {isBot && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-1">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                isBot
                  ? "bg-muted text-foreground rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md"
              )}
            >
              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
              <p className={cn(
                "text-[10px] mt-1",
                isBot ? "text-muted-foreground" : "text-primary-foreground/70"
              )}>
                {new Date(msg.createdAt).toLocaleString("en-IN", {
                  hour: "2-digit", minute: "2-digit",
                  day: "numeric", month: "short"
                })}
              </p>
            </div>
            {!isBot && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-1">
                <User className="h-3.5 w-3.5 text-emerald-700" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
