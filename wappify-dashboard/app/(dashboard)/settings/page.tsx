import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import SettingsForm from "@/components/settings/SettingsForm";
import { Settings } from "lucide-react";

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
  whatsappPhoneId: string | null;
  whatsappAccessToken: string | null;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
  aiContext: string | null;
};

// ─────────────────────────────────────────────
// Data fetcher
// ─────────────────────────────────────────────

async function getMerchantSettings(): Promise<MerchantSettings | null> {
  const merchantId = process.env.MERCHANT_ID;

  if (!merchantId) {
    console.warn("[Settings Page] MERCHANT_ID is not set in .env.local");
    return null;
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      whatsappPhoneId: true,
      whatsappAccessToken: true,
      razorpayKeyId: true,
      razorpayKeySecret: true,
      aiContext: true,
    },
  });

  return merchant;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function SettingsPage() {
  const merchant = await getMerchantSettings();

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

      {/* ── No Merchant Warning ─────────────── */}
      {!merchant && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <strong>Setup required:</strong> No merchant record found. Make sure{" "}
          <code className="rounded bg-orange-100 px-1 py-0.5 font-mono text-xs">
            MERCHANT_ID
          </code>{" "}
          is set in your{" "}
          <code className="rounded bg-orange-100 px-1 py-0.5 font-mono text-xs">
            .env.local
          </code>{" "}
          and you have run{" "}
          <code className="rounded bg-orange-100 px-1 py-0.5 font-mono text-xs">
            npm run dev
          </code>{" "}
          on the backend to seed the database.
        </div>
      )}

      {/* ── Settings Form ───────────────────── */}
      <SettingsForm merchant={merchant} />
    </div>
  );
}
