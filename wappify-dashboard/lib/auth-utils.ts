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

  const merchant = await prisma.merchant.findFirst({
    where: { userId: session.user.id },
  });

  // Check if onboarding is complete
  const isIncomplete = !merchant || !merchant.whatsappPhoneId || !merchant.razorpayKeyId;

  // We allow the onboarding page to bypass this check to prevent infinite loops
  if (isIncomplete) {
    return merchant; // Return the partial merchant so the onboarding page can use it
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
