import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";
import { generateStoreCode } from "@/lib/store-code";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const context = await getAuthContext();

    if (!context?.appUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingOrg = context.org;

    if (existingOrg) {
      await prisma.organization.update({
        where: { id: existingOrg.id },
        data: {
          onboardingCompleted: true,
        },
      });
    } else {
      const defaultName = context.appUser.name ? `${context.appUser.name}'s Store` : "My Store";
      const storeCode = generateStoreCode(defaultName, true);
      const defaultNumber = `91000000${Math.floor(1000 + Math.random() * 9000)}`;

      await prisma.$transaction(async (tx) => {
        const newOrg = await tx.organization.create({
          data: {
            name: defaultName,
            whatsappNumber: defaultNumber,
            storeCode,
            slug: storeCode.toLowerCase(),
            onboardingCompleted: true,
          },
        });

        await tx.orgMember.create({
          data: {
            orgId: newOrg.id,
            userId: context.appUser.id,
            email: context.appUser.email || "owner@wappify.local",
            role: "OWNER",
            joinedAt: new Date(),
          },
        });
      });
    }

    return NextResponse.json({ success: true, redirect: "/inbox" });
  } catch (error: any) {
    console.error("[API /onboarding/skip] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to skip onboarding" },
      { status: 500 }
    );
  }
}
