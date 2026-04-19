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
