import { prisma } from "./prisma";
import { MOCK_CATALOG } from "../config/mockCatalog";

/**
 * Generates a short, human-readable store code from the merchant name.
 * E.g. "StyleHouse India" → "STYLEHOUSE"
 */
const generateStoreCode = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "STORE";
};

export const ensureSeedData = async (): Promise<void> => {
  const merchantId = process.env.MERCHANT_ID;

  if (!merchantId) {
    console.warn(
      "[SEED] MERCHANT_ID is not set in .env — skipping seed. Orders will not work until this is set.",
    );
    return;
  }

  console.log("[SEED] Verifying seed data in database...");

  try {
    // ── 1. Upsert Merchant ───────────────────────────────────────────
    // Strategy: find by id first, then handle creation/update.
    // The storeCode field is now required and unique.

    let merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    const merchantName = "StyleHouse India";
    const storeCode = generateStoreCode(merchantName);
    const waNumber = process.env.WHATSAPP_BUSINESS_NUMBER || "0000000000";

    if (!merchant) {
      // Check for stale records that might conflict on unique fields
      const staleByCode = await prisma.merchant.findUnique({
        where: { storeCode },
      });
      if (staleByCode) {
        await prisma.product.deleteMany({ where: { merchantId: staleByCode.id } });
        await prisma.merchant.delete({ where: { id: staleByCode.id } });
        console.log(`[SEED] Removed stale merchant with code "${storeCode}"`);
      }

      const staleByNumber = await prisma.merchant.findUnique({
        where: { whatsappNumber: waNumber },
      });
      if (staleByNumber) {
        await prisma.product.deleteMany({ where: { merchantId: staleByNumber.id } });
        await prisma.merchant.delete({ where: { id: staleByNumber.id } });
        console.log(`[SEED] Removed stale merchant with number "${waNumber}"`);
      }

      // Create fresh merchant with store code
      merchant = await prisma.merchant.create({
        data: {
          id: merchantId,
          name: merchantName,
          whatsappNumber: waNumber,
          storeCode,
          whatsappConnected: true,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? null,
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? null,
          aiContext:
            "You are a helpful shopping assistant for StyleHouse India. Reply in Hinglish.",
        },
      });
    } else {
      // Merchant exists — update non-sensitive fields
      merchant = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          storeCode,
          whatsappConnected: true,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? undefined,
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? undefined,
        },
      });
    }

    console.log(
      `[SEED] ✅ Merchant ready: "${merchant.name}" (id: ${merchant.id}, storeCode: ${merchant.storeCode})`,
    );
    console.log(
      `[SEED]    WhatsApp Link: https://wa.me/${waNumber}?text=STORE-${merchant.storeCode}`,
    );

    // ── 2. Upsert Products ───────────────────────────────────────────
    let seededCount = 0;

    for (const product of MOCK_CATALOG) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          isActive: true,
        },
        create: {
          id: product.id,
          merchantId: merchant.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          currency: "INR",
          isActive: true,
          imageUrl: product.imageUrl ?? null,
        },
      });

      seededCount++;
      console.log(
        `[SEED]   └─ Product: "${product.name}" | ₹${product.price} | Stock: ${product.stock}`,
      );
    }

    console.log(`[SEED] ✅ Products ready: ${seededCount} upserted`);
    console.log("[SEED] ✅ All seed data verified successfully.\n");
  } catch (error: any) {
    console.error("[SEED] ❌ Failed to seed database");
    console.error("[SEED] Message:", error?.message || "Unknown error");
    console.error(
      "[SEED] Hint: Make sure DATABASE_URL is correct and `npx prisma migrate dev` has been run.",
    );
  }
};
