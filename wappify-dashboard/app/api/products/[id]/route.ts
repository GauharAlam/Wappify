import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// PATCH /api/products/[id]
// Edit an existing product (partial update)
// ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const merchantId = process.env.MERCHANT_ID;

    // Verify product exists and belongs to merchant
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, merchantId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 },
      );
    }

    if (merchantId && existing.merchantId !== merchantId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const { name, description, price, stock, imageUrl, isActive } =
      body as Record<string, unknown>;

    // Build update payload — only include sent fields
    const updateData: Record<string, unknown> = {};

    if (typeof name === "string" && name.trim().length >= 2) {
      updateData.name = name.trim();
    }

    if (typeof description === "string") {
      updateData.description = description.trim() || null;
    }

    if (price !== undefined) {
      const parsedPrice =
        typeof price === "number" ? price : parseFloat(String(price));
      if (!isNaN(parsedPrice) && parsedPrice > 0 && parsedPrice <= 100_000) {
        updateData.price = parsedPrice;
      }
    }

    if (stock !== undefined) {
      const parsedStock =
        typeof stock === "number" ? stock : parseInt(String(stock), 10);
      if (!isNaN(parsedStock) && parsedStock >= 0) {
        updateData.stock = parsedStock;
      }
    }

    if (typeof imageUrl === "string") {
      updateData.imageUrl = imageUrl.trim() || null;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update." },
        { status: 400 },
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    console.log(
      `[API /products/${id} PATCH] Updated fields:`,
      Object.keys(updateData),
    );

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: Number(updated.price),
      currency: updated.currency,
      stock: updated.stock,
      isActive: updated.isActive,
      imageUrl: updated.imageUrl,
      merchantId: updated.merchantId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update product";
    console.error("[API /products/[id] PATCH]", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────
// DELETE /api/products/[id]
// Soft-deletes a product by setting isActive = false.
// This preserves order history references.
// ─────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const merchantId = process.env.MERCHANT_ID;

    // Verify product exists and belongs to merchant
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, merchantId: true, name: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 },
      );
    }

    if (merchantId && existing.merchantId !== merchantId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 403 },
      );
    }

    // Soft delete — preserve order history
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    console.log(
      `[API /products/${id} DELETE] Soft-deleted product: "${existing.name}"`,
    );

    return NextResponse.json({
      success: true,
      message: `Product "${existing.name}" has been deactivated.`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete product";
    console.error("[API /products/[id] DELETE]", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
