"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  AlertTriangle,
  IndianRupee,
  Boxes,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  currency: string;
  isActive: boolean;
  imageUrl?: string | null;
  onEdit?: (product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
  }) => void;
  onDelete?: (id: string, name: string) => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStockStatus(stock: number): {
  label: string;
  className: string;
  barWidth: string;
  barColor: string;
} {
  if (stock === 0) {
    return {
      label: "Out of Stock",
      className: "text-red-600",
      barWidth: "w-0",
      barColor: "bg-red-400",
    };
  }
  if (stock <= 5) {
    return {
      label: `Low Stock (${stock})`,
      className: "text-orange-600",
      barWidth: "w-1/4",
      barColor: "bg-orange-400",
    };
  }
  if (stock <= 20) {
    return {
      label: `${stock} in stock`,
      className: "text-yellow-600",
      barWidth: "w-1/2",
      barColor: "bg-yellow-400",
    };
  }
  return {
    label: `${stock} in stock`,
    className: "text-green-600",
    barWidth: "w-full",
    barColor: "bg-green-400",
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function ProductCard({
  id,
  name,
  description,
  price,
  stock,
  currency,
  isActive,
  imageUrl,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const stockStatus = getStockStatus(stock);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 5;

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md",
        !isActive && "opacity-60 grayscale-[30%]",
      )}
    >
      {/* ── Product Image / Placeholder ────── */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/60">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 shadow-sm">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground/70">No image</span>
          </div>
        )}

        {/* ── Top badges overlay ─────────────── */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {/* Active / Inactive */}
          <Badge
            variant={isActive ? "success" : "secondary"}
            className="text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>

          {/* Low stock / Out of stock warning */}
          {isOutOfStock && (
            <Badge
              variant="destructive"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider shadow-sm"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              Out of Stock
            </Badge>
          )}

          {isLowStock && (
            <Badge
              variant="warning"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider shadow-sm"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              Low Stock
            </Badge>
          )}
        </div>

        {/* ── Action buttons overlay — top right ── */}
        <div className="absolute right-2.5 top-2.5 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {onEdit && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-lg bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background"
              onClick={() =>
                onEdit({
                  id,
                  name,
                  description,
                  price,
                  stock,
                  imageUrl: imageUrl || null,
                })
              }
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-lg bg-background/90 shadow-sm backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onDelete(id, name)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Card Body ────────────────────────── */}
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        {/* Name */}
        <h3 className="truncate text-sm font-semibold leading-tight tracking-tight">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto flex items-center gap-1 pt-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-green-100">
            <IndianRupee className="h-3 w-3 text-green-600" />
          </div>
          <span className="text-base font-bold text-foreground">
            {formatPrice(price, currency)}
          </span>
        </div>
      </CardContent>

      {/* ── Card Footer: Stock bar ────────────── */}
      <CardFooter className="flex flex-col gap-1.5 border-t bg-muted/30 px-4 py-3">
        {/* Stock label row */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Boxes className={cn("h-3.5 w-3.5", stockStatus.className)} />
            <span className={cn("text-xs font-medium", stockStatus.className)}>
              {stockStatus.label}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {currency}
          </span>
        </div>

        {/* Stock progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              stockStatus.barColor,
              stockStatus.barWidth,
            )}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
