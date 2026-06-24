import { prisma } from "./prisma";
import { MOCK_CATALOG } from "../config/mockCatalog";

/**
 * Generates a short, human-readable store code from the org name.
 * E.g. "StyleHouse India" → "STYLEHOUSE"
 */
const generateStoreCode = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "STORE";
};

export const ensureSeedData = async (): Promise<void> => {
  const orgId = process.env.ORG_ID;

  if (!orgId) {
    console.warn(
      "[SEED] ORG_ID is not set in .env — skipping seed. Orders will not work until this is set.",
    );
    return;
  }

  console.log("[SEED] Verifying seed data in database...");

  try {
    // ── 1. Upsert Organization ───────────────────────────────────────────

    let org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    const orgName = "StyleHouse India";
    const storeCode = generateStoreCode(orgName);
    const waNumber = process.env.WHATSAPP_BUSINESS_NUMBER || "0000000000";

    if (!org) {
      // Check for stale records that might conflict on unique fields
      const staleByCode = await prisma.organization.findUnique({
        where: { storeCode },
      });
      if (staleByCode) {
        await prisma.product.deleteMany({ where: { orgId: staleByCode.id } });
        await prisma.organization.delete({ where: { id: staleByCode.id } });
        console.log(`[SEED] Removed stale org with code "${storeCode}"`);
      }

      const staleByNumber = await prisma.organization.findUnique({
        where: { whatsappNumber: waNumber },
      });
      if (staleByNumber) {
        await prisma.product.deleteMany({ where: { orgId: staleByNumber.id } });
        await prisma.organization.delete({ where: { id: staleByNumber.id } });
        console.log(`[SEED] Removed stale org with number "${waNumber}"`);
      }

      // Create fresh organization with store code
      org = await prisma.organization.create({
        data: {
          id: orgId,
          name: orgName,
          slug: storeCode.toLowerCase(),
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
      // Org exists — update non-sensitive fields
      org = await prisma.organization.update({
        where: { id: orgId },
        data: {
          storeCode,
          whatsappConnected: true,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? undefined,
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? undefined,
        },
      });
    }

    console.log(
      `[SEED] ✅ Organization ready: "${org.name}" (id: ${org.id}, storeCode: ${org.storeCode})`,
    );
    console.log(
      `[SEED]    WhatsApp Link: https://wa.me/${waNumber}?text=STORE-${org.storeCode}`,
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
          orgId: org.id,
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
