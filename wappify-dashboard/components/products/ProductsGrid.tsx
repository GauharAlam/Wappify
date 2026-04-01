"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import AddProductDialog, { EditProduct } from "./AddProductDialog";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import type { SerializedProduct } from "@/app/(dashboard)/products/page";

interface ProductsGridProps {
  initialProducts: SerializedProduct[];
}

export default function ProductsGrid({ initialProducts }: ProductsGridProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<EditProduct | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filtered = initialProducts.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    );
  });

  const handleEdit = useCallback((product: EditProduct) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"? It will no longer appear on WhatsApp.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to delete product.");
        return;
      }

      router.refresh();
    } catch (err) {
      alert("Network error. Please try again.");
    }
  }, [router]);

  const handleCloseEdit = useCallback(() => {
    setIsEditDialogOpen(false);
    setTimeout(() => setEditingProduct(null), 200); // Small delay to avoid flash
  }, []);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-background"
          />
        </div>

        {/* Add Product */}
        <AddProductDialog />
      </div>

      {/* Edit Product Dialog (Hidden until triggered) */}
      <AddProductDialog 
        editProduct={editingProduct} 
        externalOpen={isEditDialogOpen} 
        onClose={handleCloseEdit} 
      />

      {/* ── Grid ────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {search ? `No products matching "${search}"` : "No products yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? "Try a different search term."
              : "Click \"Add Product\" to add your first product to the catalog."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              stock={product.stock}
              currency={product.currency}
              isActive={product.isActive}
              imageUrl={product.imageUrl}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Footer count ────────────────────── */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right tabular-nums">
          Showing{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span>
          {" "}of{" "}
          <span className="font-semibold text-foreground">
            {initialProducts.length}
          </span>{" "}
          products
        </p>
      )}
    </div>
  );
}
