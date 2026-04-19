import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import SettingsForm from "@/components/settings/SettingsForm";
import { Settings } from "lucide-react";
import { getRequiredMerchant } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings",
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type MerchantSettings = {
  id: string;
  name: string;
  whatsappNumber: string;
  storeCode: string;
  whatsappConnected: boolean;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
  upiId: string | null;
  aiContext: string | null;
};

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function SettingsPage() {
  const merchant = await getRequiredMerchant();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Page Header ────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your WhatsApp, Razorpay, and AI assistant settings.
          </p>
        </div>
      </div>

      {/* ── Settings Form ───────────────────── */}
      <SettingsForm merchant={merchant} />
    </div>
  );
}
