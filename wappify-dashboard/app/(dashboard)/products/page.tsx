import { prisma } from "@/lib/prisma";
import { Package } from "lucide-react";
import type { Metadata } from "next";
import ProductsGrid from "@/components/products/ProductsGrid";
import { getRequiredMerchantId } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Products",
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SerializedProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─────────────────────────────────────────────
// Data fetcher — direct Prisma (Server Component)
// ─────────────────────────────────────────────

async function getProducts(): Promise<SerializedProduct[]> {
  const merchantId = await getRequiredMerchantId();

  const products = await prisma.product.findMany({
    where: merchantId ? { merchantId } : { id: "none" },
    orderBy: { createdAt: "desc" },
  });

  // Prisma Decimal is not serializable — convert to number
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    currency: p.currency,
    stock: p.stock,
    isActive: p.isActive,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function ProductsPage() {
  const products = await getProducts();

  const activeCount = products.filter((p) => p.isActive).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your catalog — products shown here are available via
            WhatsApp.
          </p>
        </div>
      </div>

      {/* ── Summary Pills ──────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{products.length}</span>
          <span className="text-muted-foreground">total products</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-medium">{activeCount}</span>
          <span className="text-muted-foreground">active</span>
        </div>

        {outOfStockCount > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="font-medium text-orange-700">{outOfStockCount}</span>
            <span className="text-orange-600">out of stock</span>
          </div>
        )}
      </div>

      {/* ── Products Grid (Client Component) ─ */}
      {/* ProductsGrid is a Client Component so it can handle    */}
      {/* the Add / Edit dialog state without a full page reload. */}
      <ProductsGrid initialProducts={products} />
    </div>
  );
}
