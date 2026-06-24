import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthContext } from "@/lib/auth-utils";
import { generateStoreCode } from "@/lib/store-code";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getAuthContext();
  const orgId = context?.org?.id;

  if (!orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsappNumber: true,
        storeCode: true,
        whatsappConnected: true,
        razorpayKeyId: true,
        razorpayKeySecret: true,
        upiId: true,
        aiContext: true,
        businessHoursSchedule: true,
        timezone: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, message: "Organization not found." },
        { status: 404 }
      );
    }

    // Mask secrets for safety
    const mask = (val: string | null) => 
      val ? `••••••••${val.slice(-4)}` : null;

    const data = {
      ...org,
      razorpayKeySecret: mask(org.razorpayKeySecret),
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API /settings GET] Error:", message);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const context = await getAuthContext();

  if (!context?.appUser?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {

    const body = await req.json();
    const existingOrg = context.org;

    // ── Whitelist only the fields that are safe to update ─────────────────
    const {
      name,
      whatsappNumber,
      razorpayKeyId,
      razorpayKeySecret,
      upiId,
      aiContext,
      businessHoursSchedule,
    } = body;

    // ── Input length validation for sensitive fields ─────────────────────
    const MAX_TOKEN_LENGTH = 500;
    const MAX_NAME_LENGTH = 100;
    const MAX_CONTEXT_LENGTH = 5000;

    if (typeof name === "string" && name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Business name must be under ${MAX_NAME_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (typeof razorpayKeySecret === "string" && razorpayKeySecret.length > MAX_TOKEN_LENGTH) {
      return NextResponse.json(
        { success: false, message: "Razorpay key secret exceeds maximum allowed length." },
        { status: 400 }
      );
    }

    if (typeof aiContext === "string" && aiContext.length > MAX_CONTEXT_LENGTH) {
      return NextResponse.json(
        { success: false, message: `AI context must be under ${MAX_CONTEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const nextName =
      (typeof name === "string" && name.trim()) ||
      existingOrg?.name ||
      context.appUser.name ||
      "My Store";
    const nextWhatsappNumber =
      (typeof whatsappNumber === "string" && whatsappNumber.trim()) ||
      existingOrg?.whatsappNumber ||
      null;

    if (!existingOrg && !nextWhatsappNumber) {
      return NextResponse.json(
        { success: false, message: "WhatsApp number is required to create a store." },
        { status: 400 }
      );
    }

    // Build the update payload — only include keys that were actually sent
    const updateData: Record<string, unknown> = {};

    updateData.name = nextName;
    updateData.storeCode = generateStoreCode(nextName);

    if (typeof whatsappNumber === "string" && whatsappNumber.trim()) {
      updateData.whatsappNumber = whatsappNumber.trim();
    }

    if (typeof razorpayKeyId === "string") {
      updateData.razorpayKeyId = razorpayKeyId.trim() || null;
    }

    if (typeof razorpayKeySecret === "string" && razorpayKeySecret.trim()) {
      updateData.razorpayKeySecret = razorpayKeySecret.trim();
    }

    if (typeof upiId === "string") {
      updateData.upiId = upiId.trim() || null;
    }

    if (typeof aiContext === "string") {
      updateData.aiContext = aiContext.trim() || null;
    }

    if (businessHoursSchedule !== undefined) {
      updateData.businessHoursSchedule = businessHoursSchedule;
    }

    if (
      Object.keys(updateData).length === 2 &&
      updateData.name === existingOrg?.name &&
      updateData.storeCode === existingOrg?.storeCode
    ) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updated = existingOrg
      ? await prisma.organization.update({
          where: { id: existingOrg.id },
          data: updateData,
          select: {
            id: true,
            name: true,
            whatsappNumber: true,
            storeCode: true,
            razorpayKeyId: true,
            upiId: true,
            aiContext: true,
            businessHoursSchedule: true,
            updatedAt: true,
          },
        })
      : await prisma.$transaction(async (tx) => {
          // Create the organization
          const newOrg = await tx.organization.create({
            data: {
              name: nextName,
              whatsappNumber: nextWhatsappNumber!,
              storeCode: generateStoreCode(nextName),
              slug: generateStoreCode(nextName).toLowerCase(),
              razorpayKeyId:
                typeof razorpayKeyId === "string"
                  ? razorpayKeyId.trim() || null
                  : null,
              razorpayKeySecret:
                typeof razorpayKeySecret === "string" &&
                razorpayKeySecret.trim()
                  ? razorpayKeySecret.trim()
                  : null,
              upiId: typeof upiId === "string" ? upiId.trim() || null : null,
              aiContext:
                typeof aiContext === "string" ? aiContext.trim() || null : null,
            },
            select: {
              id: true,
              name: true,
              whatsappNumber: true,
              storeCode: true,
              razorpayKeyId: true,
              upiId: true,
              aiContext: true,
              businessHoursSchedule: true,
              updatedAt: true,
            },
          });

          // Create the OrgMember record (OWNER)
          await tx.orgMember.create({
            data: {
              orgId: newOrg.id,
              userId: context.appUser.id,
              email: context.appUser.email!,
              role: "OWNER",
              joinedAt: new Date(),
            },
          });

          return newOrg;
        });

    console.log(
      `[API /settings PATCH] Organization ${updated.id} updated fields:`,
      Object.keys(updateData),
    );

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      data: {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
    } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API /settings PATCH] FULL ERROR:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { success: false, message: "This WhatsApp number or Store Name is already in use." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: `Failed to update settings: ${message}` },
      { status: 500 }
    );
  }
}
