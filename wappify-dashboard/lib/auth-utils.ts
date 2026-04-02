import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Gets the current authenticated merchant from the session.
 * If not authenticated, redirects to login.
 * If no merchant found, redirects to the merchant setup page?
 */
export async function getRequiredMerchant() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // We check the database to ensure it still exists and is linked
  const merchant = await prisma.merchant.findFirst({
    where: { userId: session.user.id },
  });

  if (!merchant) {
    // If no merchant exists for this user, we might want to redirect
    // to an onboarding page. For now, we allow null and handle it in UI
    // but the ID is what most components need.
    return null;
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
