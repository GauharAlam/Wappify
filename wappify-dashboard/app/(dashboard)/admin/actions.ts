"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveSubscription(subscriptionId: string) {
  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "ACTIVE" },
    });
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("[ADMIN ACTION] Approve Failed:", error);
    return { success: false, error: "Failed to approve subscription." };
  }
}

export async function revokeSubscription(subscriptionId: string) {
  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("[ADMIN ACTION] Revoke Failed:", error);
    return { success: false, error: "Failed to revoke subscription." };
  }
}
