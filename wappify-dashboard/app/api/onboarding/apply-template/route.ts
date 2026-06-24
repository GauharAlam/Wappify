import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-utils";
import { ONBOARDING_TEMPLATES } from "@/lib/templates";
import { generateStoreCode } from "@/lib/store-code";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const context = await getAuthContext();

    if (!context?.appUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, businessName, whatsappNumber, aiContext } = body;

    if (!templateId || !businessName || !whatsappNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const template = ONBOARDING_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const existingOrg = context.org;

    // Idempotency check: if already completed, just return success
    if (existingOrg?.onboardingCompleted) {
      return NextResponse.json({ success: true, message: "Already onboarded." });
    }

    const storeCode = existingOrg?.storeCode || generateStoreCode(businessName);
    const finalAiContext = aiContext || template.defaultAiContext;

    // Execute in a transaction to ensure all or nothing
    await prisma.$transaction(async (tx) => {
      let targetOrgId = existingOrg?.id;

      if (!targetOrgId) {
        // Create organization
        const newOrg = await tx.organization.create({
          data: {
            name: businessName,
            whatsappNumber: whatsappNumber,
            storeCode: storeCode,
            slug: storeCode.toLowerCase(),
            aiContext: finalAiContext,
            selectedTemplate: templateId,
            onboardingCompleted: true,
          },
        });
        targetOrgId = newOrg.id;

        // Create the owner membership
        await tx.orgMember.create({
          data: {
            orgId: targetOrgId,
            userId: context.appUser.id,
            email: context.appUser.email!,
            role: "OWNER",
            joinedAt: new Date(),
          },
        });
      } else {
        // Update existing organization
        await tx.organization.update({
          where: { id: targetOrgId },
          data: {
            name: businessName,
            whatsappNumber: whatsappNumber,
            aiContext: finalAiContext,
            selectedTemplate: templateId,
            onboardingCompleted: true,
          },
        });
      }

      // Create Default Tags (skip duplicates)
      if (template.defaultTags.length > 0) {
        await tx.tag.createMany({
          data: template.defaultTags.map((t) => ({
            orgId: targetOrgId!,
            name: t.name,
            color: t.color,
          })),
          skipDuplicates: true,
        });
      }

      // Ensure we don't duplicate default rules if user clicked twice quickly before onboardingCompleted updated
      const existingRules = await tx.automationRule.findMany({
        where: { orgId: targetOrgId, source: "template" },
      });

      if (existingRules.length === 0 && template.defaultRules.length > 0) {
        await tx.automationRule.createMany({
          data: template.defaultRules.map((r) => ({
            orgId: targetOrgId!,
            name: r.name,
            isActive: true,
            priority: r.priority,
            trigger: r.trigger,
            matchMode: r.matchMode,
            keywords: r.keywords,
            action: r.action,
            responseText: r.responseText || null,
            source: "template",
            templateId: templateId,
          })),
        });
      }
    });

    return NextResponse.json({ success: true, redirect: "/inbox" });

  } catch (error: any) {
    console.error("❌ [API /onboarding/apply-template] Error:", error);
    
    // Handle unique constraint failures gracefully
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "The provided WhatsApp number or Store name is already registered." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
