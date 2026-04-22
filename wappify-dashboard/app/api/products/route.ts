import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// GET /api/products
// Returns all products for the current merchant,
// ordered newest first. Used by client components
// that need to refetch after mutations.
// ─────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  const merchantId = session?.user?.merchantId;

  if (!merchantId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal and Date fields so the JSON response
    // is safe to consume directly in client components.
    const serialized = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      currency: p.currency,
      stock: p.stock,
      isActive: p.isActive,
      imageUrl: p.imageUrl,
      merchantId: p.merchantId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch products";
    console.error("[API /products GET]", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────
// POST /api/products
// Creates a new product for the current merchant.
// Body: { name, description?, price, stock, imageUrl? }
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  const merchantId = session?.user?.merchantId;

  if (!merchantId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    // ── Parse body ────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const {
      name,
      description = null,
      price,
      stock,
      imageUrl = null,
    } = body as Record<string, unknown>;

    // ── Validate ──────────────────────────────
    const validationErrors: string[] = [];

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      validationErrors.push("name: must be a string of at least 2 characters.");
    }

    const parsedPrice = typeof price === "number" ? price : parseFloat(String(price));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      validationErrors.push("price: must be a positive number.");
    }
    if (parsedPrice > 100_000) {
      validationErrors.push("price: cannot exceed ₹1,00,000.");
    }

    const parsedStock = typeof stock === "number" ? stock : parseInt(String(stock), 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      validationErrors.push("stock: must be 0 or a positive integer.");
    }

    if (
      imageUrl !== null &&
      imageUrl !== undefined &&
      imageUrl !== "" &&
      typeof imageUrl !== "string"
    ) {
      validationErrors.push("imageUrl: must be a string URL or omitted.");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: validationErrors,
        },
        { status: 422 },
      );
    }

    // ── Create product ────────────────────────
    const product = await prisma.product.create({
      data: {
        merchantId,
        name: (name as string).trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        price: parsedPrice,
        stock: parsedStock,
        currency: "INR",
        isActive: true,
        imageUrl:
          typeof imageUrl === "string" && imageUrl.trim()
            ? imageUrl.trim()
            : null,
      },
    });

    console.log(
      `[API /products POST] Product created: "${product.name}" (id: ${product.id})`,
    );

    // Serialize before returning
    return NextResponse.json(
      {
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        currency: product.currency,
        stock: product.stock,
        isActive: product.isActive,
        imageUrl: product.imageUrl,
        merchantId: product.merchantId,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";
    console.error("[API /products POST]", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
