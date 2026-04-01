import { prisma } from "../lib/prisma";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CreatePendingOrderParams {
  merchantId: string;
  customerId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
}

// ─────────────────────────────────────────────
// Customer Operations
// ─────────────────────────────────────────────

/**
 * Finds an existing customer by WhatsApp ID or creates a new one.
 * This is the entry point for every inbound message — we always
 * ensure the customer exists in the DB before doing anything else.
 */
export const findOrCreateCustomer = async (
  waId: string,
  name?: string,
) => {
  const customer = await prisma.customer.upsert({
    where: { waId },
    update: {
      // Only update the name if a new one is provided
      ...(name ? { name } : {}),
    },
    create: {
      waId,
      name: name ?? null,
    },
  });

  console.log(
    `[ORDER SERVICE] Customer resolved — ID: ${customer.id} | waId: ${customer.waId} | Name: ${customer.name ?? "Unknown"}`,
  );

  return customer;
};

// ─────────────────────────────────────────────
// Order Operations
// ─────────────────────────────────────────────

/**
 * Creates a new PENDING order with a single OrderItem.
 * Called right before generating a Razorpay payment link.
 */
export const createPendingOrder = async (params: CreatePendingOrderParams) => {
  const { merchantId, customerId, productId, quantity, pricePerUnit } = params;

  const totalAmount = pricePerUnit * quantity;

  console.log(
    `[ORDER SERVICE] Creating order — Merchant: ${merchantId} | Customer: ${customerId} | Product: ${productId} | Qty: ${quantity} | Total: ₹${totalAmount}`,
  );

  const order = await prisma.order.create({
    data: {
      merchantId,
      customerId,
      status: "PENDING",
      totalAmount,
      items: {
        create: {
          productId,
          quantity,
          priceAtTime: pricePerUnit,
        },
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: true,
    },
  });

  console.log(
    `[ORDER SERVICE] ✅ Order created — ID: ${order.id} | Total: ₹${totalAmount}`,
  );

  return order;
};

/**
 * Stores the Razorpay Payment Link ID against the order after
 * the link has been successfully created. We use razorpayOrderId
 * to store the payment link ID (plink_xxx) for later lookup.
 */
export const updateOrderWithRazorpayLink = async (
  orderId: string,
  razorpayPaymentLinkId: string,
) => {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { razorpayOrderId: razorpayPaymentLinkId },
  });

  console.log(
    `[ORDER SERVICE] ✅ Order ${orderId} linked to Razorpay link: ${razorpayPaymentLinkId}`,
  );

  return updated;
};

/**
 * Looks up an order by its stored Razorpay Payment Link ID and
 * marks it as PAID. Also stores the final Razorpay Payment ID.
 * Returns the fully populated order (with customer + items) so
 * the webhook controller can send a WhatsApp confirmation.
 */
export const markOrderAsPaid = async (
  razorpayPaymentLinkId: string,
  razorpayPaymentId: string,
) => {
  console.log(
    `[ORDER SERVICE] Marking order as PAID — Link ID: ${razorpayPaymentLinkId} | Payment ID: ${razorpayPaymentId}`,
  );

  // We stored the payment link ID in razorpayOrderId field
  const existingOrder = await prisma.order.findFirst({
    where: { razorpayOrderId: razorpayPaymentLinkId },
  });

  if (!existingOrder) {
    console.warn(
      `[ORDER SERVICE] ⚠️ No order found for Razorpay link ID: ${razorpayPaymentLinkId}`,
    );
    return null;
  }

  // Guard against double-processing the same payment event
  if (existingOrder.status === "PAID") {
    console.warn(
      `[ORDER SERVICE] ⚠️ Order ${existingOrder.id} is already PAID — skipping duplicate event`,
    );
    return null;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: existingOrder.id },
    data: {
      status: "PAID",
      razorpayPaymentId,
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  console.log(
    `[ORDER SERVICE] ✅ Order ${updatedOrder.id} marked as PAID`,
  );

  return updatedOrder;
};

/**
 * Fetches a single order by its internal ID with full relations.
 * Useful for debugging or building an order detail endpoint later.
 */
export const getOrderById = async (orderId: string) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      merchant: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

/**
 * Fetches all orders for a given customer (by waId), newest first.
 * Useful for building an order history flow in WhatsApp later.
 */
export const getOrdersByCustomerWaId = async (waId: string) => {
  return prisma.order.findMany({
    where: {
      customer: { waId },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
