import { prisma } from "./prisma";
import { MOCK_CATALOG } from "../config/mockCatalog";

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
    // Strategy: find by id first, then by whatsappNumber (handles stale
    // placeholder records), then create fresh. This makes the seed fully
    // idempotent even if the MERCHANT_ID was changed between runs.

    let merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      // Check if a stale record exists with the same whatsappNumber
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "0000000000";
      const stale = await prisma.merchant.findUnique({
        where: { whatsappNumber: phoneId },
      });

      if (stale) {
        console.log(
          `[SEED] Found stale merchant (id: ${stale.id}) — migrating to new MERCHANT_ID`,
        );

        // Delete stale products linked to the old merchant first
        await prisma.product.deleteMany({
          where: { merchantId: stale.id },
        });

        // Delete the stale merchant
        await prisma.merchant.delete({
          where: { id: stale.id },
        });

        console.log("[SEED] Stale merchant and its products removed.");
      }

      // Create fresh merchant with the correct UUID
      merchant = await prisma.merchant.create({
        data: {
          id: merchantId,
          name: "StyleHouse India",
          whatsappNumber: phoneId,
          whatsappPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
          whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? null,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? null,
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? null,
          aiContext:
            "You are a helpful shopping assistant for StyleHouse India. Reply in Hinglish.",
        },
      });
    } else {
      // Merchant exists with the correct ID — just keep credentials in sync
      merchant = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          whatsappPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? undefined,
          whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? undefined,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? undefined,
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? undefined,
        },
      });
    }

    console.log(
      `[SEED] ✅ Merchant ready: "${merchant.name}" (id: ${merchant.id})`,
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
