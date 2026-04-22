import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  const session = await auth();
  const merchantId = session?.user?.merchantId;

  if (!merchantId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search")?.trim() ?? undefined;

    const skip = (page - 1) * limit;

    // ── Build where clause ────────────────────────────────────────────
    const where: Record<string, unknown> = { merchantId };

    if (status && status !== "ALL") where.status = status;

    if (search) {
      where.OR = [
        {
          customer: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          customer: {
            waId: { contains: search },
          },
        },
        {
          razorpayPaymentId: { contains: search, mode: "insensitive" },
        },
      ];
    }

    // ── Run query + count in parallel ─────────────────────────────────
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, waId: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // ── Serialize Decimal + Date fields ────────────────────────────────
    const serialized = orders.map((order) => ({
      id: order.id,
      shortId: order.id.slice(0, 8).toUpperCase(),
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        waId: order.customer.waId,
      },
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        priceAtTime: Number(item.priceAtTime),
        productName: item.product.name,
        productId: item.product.id,
        imageUrl: item.product.imageUrl,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: serialized,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[API /orders GET] Error:", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────
// PATCH /api/orders
// Updates order status with transition validation.
// Body: { orderId: string, status: "SHIPPED" | "DELIVERED" | "CANCELLED" }
// ─────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], // terminal state
  CANCELLED: [], // terminal state
};

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const merchantId = session?.user?.merchantId;

  if (!merchantId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const { orderId, status } = body as Record<string, unknown>;

    // ── Validate inputs ──────────────────────────
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { success: false, message: "orderId is required." },
        { status: 400 },
      );
    }

    const validStatuses = ["SHIPPED", "DELIVERED", "CANCELLED"];
    if (!status || !validStatuses.includes(status as string)) {
      return NextResponse.json(
        {
          success: false,
          message: `status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ── Fetch current order ──────────────────────
    const order = await prisma.order.findUnique({
      where: { id: orderId as string, merchantId },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 },
      );
    }

    // ── Validate transition ──────────────────────
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status as string)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.length > 0 ? allowed.join(", ") : "none (terminal state)"}`,
        },
        { status: 422 },
      );
    }

    // ── Update order ─────────────────────────────
    const updated = await prisma.order.update({
      where: { id: orderId as string },
      data: { status: status as "SHIPPED" | "DELIVERED" | "CANCELLED" },
      include: {
        customer: { select: { name: true, waId: true } },
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    console.log(
      `[API /orders PATCH] Order ${orderId} status: ${order.status} → ${status}`,
    );

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: {
        id: updated.id,
        status: updated.status,
        totalAmount: Number(updated.totalAmount),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update order";
    console.error("[API /orders PATCH] Error:", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
