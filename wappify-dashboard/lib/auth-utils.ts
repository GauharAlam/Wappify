import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Merchant, User } from "@prisma/client";

const getPrimaryEmail = (
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
): string | null => {
  if (!clerkUser) return null;
  return (
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    null
  );
};

const syncClerkUserIntoApp = async (): Promise<User | null> => {
  const { userId } = await auth();

  if (!userId) return null;

  const clerkUser = await currentUser();
  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    throw new Error("Authenticated Clerk user is missing a primary email.");
  }

  const name =
    clerkUser?.fullName ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      image: clerkUser?.imageUrl ?? undefined,
    },
    create: {
      email,
      name,
      image: clerkUser?.imageUrl ?? null,
      password: null,
    },
  });
};

export async function getAuthContext(): Promise<{
  appUser: User;
  merchant: Merchant | null;
} | null> {
  const appUser = await syncClerkUserIntoApp();

  if (!appUser) return null;

  const merchant = await prisma.merchant.findFirst({
    where: { userId: appUser.id },
  });

  return { appUser, merchant };
}

export async function getRequiredAppUser() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  return context.appUser;
}

export async function getRequiredAdminUser() {
  const appUser = await getRequiredAppUser();

  if (appUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return appUser;
}

/**
 * Gets the current authenticated merchant from the session.
 * If not authenticated, redirects to login.
 * If no merchant found, redirects to the merchant setup page?
 */
export async function getRequiredMerchant() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  const { merchant } = context;

  // Check if onboarding is complete
  // Merchants need: a name, a WhatsApp business number, and at least one payment method
  const hasPaymentMethod = merchant?.razorpayKeyId || merchant?.upiId;
  if (!merchant || !merchant.whatsappNumber || !hasPaymentMethod) {
    redirect("/onboarding");
  }

  return merchant;
}

/**
 * Simplified helper for server components that just need the ID.
 */
export async function getRequiredMerchantId() {
  const merchant = await getRequiredMerchant();
  return merchant?.id || null;
}
