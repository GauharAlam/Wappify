import { prisma } from "../lib/prisma";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CreatePendingOrderParams {
  orgId: string;
  contactId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
}

// ─────────────────────────────────────────────
// Contact Operations
// ─────────────────────────────────────────────

/**
 * Finds an existing contact by WhatsApp ID within an org, or creates a new one.
 * This is the entry point for every inbound message — we always
 * ensure the contact exists in the DB before doing anything else.
 */
export const findOrCreateContact = async (
  orgId: string,
  waId: string,
  name?: string,
) => {
  const contact = await prisma.contact.upsert({
    where: { orgId_waId: { orgId, waId } },
    update: {
      ...(name ? { name } : {}),
    },
    create: {
      orgId,
      waId,
      name: name ?? null,
    },
  });

  console.log(
    `[ORDER SERVICE] Contact resolved — ID: ${contact.id} | waId: ${contact.waId} | Name: ${contact.name ?? "Unknown"}`,
  );

  return contact;
};

// ─────────────────────────────────────────────
// Order Operations
// ─────────────────────────────────────────────

/**
 * Creates a new PENDING order with a single OrderItem.
 * Called right before generating a Razorpay payment link.
 */
export const createPendingOrder = async (params: CreatePendingOrderParams) => {
  const { orgId, contactId, productId, quantity, pricePerUnit } = params;

  const totalAmount = pricePerUnit * quantity;

  console.log(
    `[ORDER SERVICE] Creating order — Org: ${orgId} | Contact: ${contactId} | Product: ${productId} | Qty: ${quantity} | Total: ₹${totalAmount}`,
  );

  const order = await prisma.order.create({
    data: {
      orgId,
      contactId,
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
      contact: true,
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
 * Returns the fully populated order (with contact + items) so
 * the webhook controller can send a WhatsApp confirmation.
 */
export const markOrderAsPaid = async (
  razorpayPaymentLinkId: string,
  razorpayPaymentId: string,
) => {
  console.log(
    `[ORDER SERVICE] Marking order as PAID — Link ID: ${razorpayPaymentLinkId} | Payment ID: ${razorpayPaymentId}`,
  );

  const existingOrder = await prisma.order.findFirst({
    where: { razorpayOrderId: razorpayPaymentLinkId },
  });

  if (!existingOrder) {
    console.warn(
      `[ORDER SERVICE] ⚠️ No order found for Razorpay link ID: ${razorpayPaymentLinkId}`,
    );
    return null;
  }

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
      contact: true,
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
 */
export const getOrderById = async (orderId: string) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      contact: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

/**
 * Fetches all orders for a given contact (by waId), newest first.
 */
export const getOrdersByContactWaId = async (orgId: string, waId: string) => {
  return prisma.order.findMany({
    where: {
      orgId,
      contact: { waId },
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

// ─────────────────────────────────────────────
// Cart Operations
// ─────────────────────────────────────────────

/**
 * Adds an item to the contact's cart.
 */
export const addToCart = async (orgId: string, customerWaId: string, productId: string, quantity: number = 1) => {
  const contact = await findOrCreateContact(orgId, customerWaId);
  return prisma.cart.upsert({
    where: { orgId_contactId: { orgId, contactId: contact.id } },
    update: {
      items: {
        create: { productId, quantity }
      }
    },
    create: {
      orgId,
      contactId: contact.id,
      items: {
        create: { productId, quantity }
      }
    },
    include: { items: { include: { product: true } } }
  });
};

/**
 * Fetches the active cart for a contact.
 */
export const getCart = async (orgId: string, customerWaId: string) => {
  const contact = await prisma.contact.findUnique({
    where: { orgId_waId: { orgId, waId: customerWaId } },
  });
  if (!contact) return null;

  return prisma.cart.findUnique({
    where: { orgId_contactId: { orgId, contactId: contact.id } },
    include: { items: { include: { product: true } } }
  });
};

/**
 * Creates a PENDING order from the current Cart and empties it.
 */
export const createOrderFromCart = async (orgId: string, customerWaId: string) => {
  const cart = await getCart(orgId, customerWaId);
  if (!cart || !cart.items || cart.items.length === 0) return null;

  let totalAmount = 0;
  const orderItemsData = cart.items.map((item: any) => {
    const itemTotal = Number(item.product.price) * item.quantity;
    totalAmount += itemTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: item.product.price
    };
  });

  const order = await prisma.order.create({
    data: {
      orgId,
      contactId: cart.contactId,
      status: "PENDING",
      totalAmount,
      items: {
        create: orderItemsData
      }
    },
    include: {
      items: { include: { product: true } },
      contact: true
    }
  });

  // Empty cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return order;
};
