"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  MessageSquare,
  CreditCard,
  Bot,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MerchantSettings } from "@/app/(dashboard)/settings/page";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SettingsFormProps {
  merchant: MerchantSettings | null;
}

interface FormState {
  // Merchant
  name: string;
  whatsappNumber: string;
  // WhatsApp API
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  // Razorpay
  razorpayKeyId: string;
  razorpayKeySecret: string;
  // AI
  aiContext: string;
}

type SectionStatus = "idle" | "saving" | "saved" | "error";

interface SectionState {
  status: SectionStatus;
  message: string | null;
}

// ─────────────────────────────────────────────
// Field component
// ─────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ id, label, hint, required, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Secret Input — toggles visibility
// ─────────────────────────────────────────────

interface SecretInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

function SecretInput({ id, className, ...props }: SecretInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className={cn("pr-10 font-mono text-sm", className)}
        autoComplete="off"
        spellCheck={false}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Hide value" : "Show value"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section feedback banner
// ─────────────────────────────────────────────

function SectionFeedback({
  status,
  message,
}: {
  status: SectionStatus;
  message: string | null;
}) {
  if (status === "idle" || !message) return null;

  if (status === "saved") {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700"
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        {message}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
      >
        ⚠️ {message}
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// Section header with icon
// ─────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
  title: string;
  description: string;
}

function SectionHeader({
  icon: Icon,
  iconClass,
  bgClass,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            bgClass,
          )}
        >
          <Icon className={cn("h-4.5 w-4.5", iconClass)} />
        </div>
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs leading-relaxed">
            {description}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

// ─────────────────────────────────────────────
// Save Section Button
// ─────────────────────────────────────────────

function SaveButton({ status }: { status: SectionStatus }) {
  const isSaving = status === "saving";

  return (
    <Button
      type="submit"
      size="sm"
      disabled={isSaving}
      className="min-w-[100px]"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </>
      )}
    </Button>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function SettingsForm({ merchant }: SettingsFormProps) {
  const router = useRouter();

  // ── Form state ─────────────────────────────
  const [form, setForm] = React.useState<FormState>({
    name: merchant?.name ?? "",
    whatsappNumber: merchant?.whatsappNumber ?? "",
    whatsappPhoneId: merchant?.whatsappPhoneId ?? "",
    whatsappAccessToken: merchant?.whatsappAccessToken ?? "",
    razorpayKeyId: merchant?.razorpayKeyId ?? "",
    razorpayKeySecret: merchant?.razorpayKeySecret ?? "",
    aiContext: merchant?.aiContext ?? "",
  });

  // ── Per-section save status ─────────────────
  const [whatsappStatus, setWhatsappStatus] = React.useState<SectionState>({
    status: "idle",
    message: null,
  });
  const [razorpayStatus, setRazorpayStatus] = React.useState<SectionState>({
    status: "idle",
    message: null,
  });
  const [aiStatus, setAiStatus] = React.useState<SectionState>({
    status: "idle",
    message: null,
  });

  // ── Shared change handler ───────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Shared PATCH helper ─────────────────────
  const patchSettings = async (
    payload: Partial<FormState>,
    setStatus: React.Dispatch<React.SetStateAction<SectionState>>,
    successMsg: string,
  ) => {
    setStatus({ status: "saving", message: null });

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.message ??
            `Server error (${response.status}). Please try again.`,
        );
      }

      setStatus({ status: "saved", message: successMsg });
      router.refresh();

      // Auto-reset after 4 seconds
      setTimeout(() => {
        setStatus({ status: "idle", message: null });
      }, 4000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      console.error("[SettingsForm] PATCH error:", message);
      setStatus({ status: "error", message });
    }
  };

  // ── Section submit handlers ─────────────────

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    patchSettings(
      {
        name: form.name,
        whatsappNumber: form.whatsappNumber,
        whatsappPhoneId: form.whatsappPhoneId,
        ...(form.whatsappAccessToken.trim() && !form.whatsappAccessToken.includes("•")
          ? { whatsappAccessToken: form.whatsappAccessToken }
          : {}),
      },
      setWhatsappStatus,
      "WhatsApp settings saved successfully!",
    );
  };

  const handleRazorpaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    patchSettings(
      {
        razorpayKeyId: form.razorpayKeyId,
        ...(form.razorpayKeySecret.trim() && !form.razorpayKeySecret.includes("•")
          ? { razorpayKeySecret: form.razorpayKeySecret }
          : {}),
      },
      setRazorpayStatus,
      "Razorpay settings saved successfully!",
    );
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    patchSettings(
      { aiContext: form.aiContext },
      setAiStatus,
      "AI system prompt saved successfully!",
    );
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════ */}
      {/* Section 1: WhatsApp                   */}
      {/* ══════════════════════════════════════ */}

      <Card>
        <SectionHeader
          icon={MessageSquare}
          iconClass="text-green-600"
          bgClass="bg-green-100"
          title="WhatsApp Configuration"
          description="Connect your Meta WhatsApp Business API credentials. You can find these in your Meta Developer Dashboard under App → WhatsApp → API Setup."
        />

        <Separator />

        <CardContent className="pt-5">
          <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
            {/* Business Name */}
            <Field
              id="name"
              label="Business Name"
              required
              hint="This name appears in customer-facing messages."
            >
              <Input
                id="name"
                name="name"
                placeholder="e.g. StyleHouse India"
                value={form.name}
                onChange={handleChange}
                disabled={whatsappStatus.status === "saving"}
                maxLength={100}
              />
            </Field>

            {/* WhatsApp Phone Number */}
            <Field
              id="whatsappNumber"
              label="WhatsApp Phone Number"
              required
              hint="The phone number registered with your Meta WhatsApp Business Account (include country code, e.g. 919876543210)."
            >
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                placeholder="919876543210"
                value={form.whatsappNumber}
                onChange={handleChange}
                disabled={whatsappStatus.status === "saving"}
                maxLength={20}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Phone Number ID */}
              <Field
                id="whatsappPhoneId"
                label="Phone Number ID"
                hint="Found in Meta Developer Dashboard → WhatsApp → API Setup. Looks like: 123456789012345"
              >
                <Input
                  id="whatsappPhoneId"
                  name="whatsappPhoneId"
                  placeholder="123456789012345"
                  value={form.whatsappPhoneId}
                  onChange={handleChange}
                  disabled={whatsappStatus.status === "saving"}
                  className="font-mono text-sm"
                />
              </Field>

              {/* Permanent Access Token */}
              <Field
                id="whatsappAccessToken"
                label="Permanent Access Token"
                hint={
                  merchant?.whatsappPhoneId
                    ? "A token is already saved. Paste a new one only to replace it."
                    : "Generate from Meta Dashboard. Required to send WhatsApp messages."
                }
              >
                <SecretInput
                  id="whatsappAccessToken"
                  name="whatsappAccessToken"
                  placeholder={
                    merchant?.whatsappPhoneId
                      ? "Leave blank to keep current token"
                      : "EAAxxxxxxxxxxxxx..."
                  }
                  value={form.whatsappAccessToken}
                  onChange={handleChange}
                  disabled={whatsappStatus.status === "saving"}
                />
              </Field>
            </div>

            {/* Webhook info banner */}
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
              <strong className="font-semibold">Webhook URL:</strong>{" "}
              <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
                https://your-domain.com/api/webhook/whatsapp
              </code>
              <br />
              <span className="mt-1 block text-blue-600">
                Set this as your callback URL in the Meta Developer Dashboard.
                The Verify Token must match{" "}
                <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
                  WHATSAPP_VERIFY_TOKEN
                </code>{" "}
                in your backend .env.
              </span>
            </div>

            <SectionFeedback
              status={whatsappStatus.status}
              message={whatsappStatus.message}
            />

            <div className="flex justify-end border-t pt-3">
              <SaveButton status={whatsappStatus.status} />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════ */}
      {/* Section 2: Razorpay                   */}
      {/* ══════════════════════════════════════ */}

      <Card>
        <SectionHeader
          icon={CreditCard}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
          title="Razorpay Configuration"
          description="Used to generate UPI/card payment links sent to customers over WhatsApp. Obtain your API keys from the Razorpay Dashboard → Settings → API Keys."
        />

        <Separator />

        <CardContent className="pt-5">
          <form onSubmit={handleRazorpaySubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Key ID */}
              <Field
                id="razorpayKeyId"
                label="Key ID"
                hint={
                  <>
                    Starts with{" "}
                    <code className="rounded bg-muted px-1 font-mono text-[10px]">
                      rzp_live_
                    </code>{" "}
                    or{" "}
                    <code className="rounded bg-muted px-1 font-mono text-[10px]">
                      rzp_test_
                    </code>
                    . Safe to expose.
                  </>
                }
              >
                <Input
                  id="razorpayKeyId"
                  name="razorpayKeyId"
                  placeholder="rzp_live_xxxxxxxxxxxx"
                  value={form.razorpayKeyId}
                  onChange={handleChange}
                  disabled={razorpayStatus.status === "saving"}
                  className="font-mono text-sm"
                />
              </Field>

              {/* Key Secret */}
              <Field
                id="razorpayKeySecret"
                label="Key Secret"
                hint={
                  merchant?.razorpayKeyId
                    ? "A secret is already saved. Paste a new one only to replace it."
                    : "Keep this private. Never share or expose in client-side code."
                }
              >
                <SecretInput
                  id="razorpayKeySecret"
                  name="razorpayKeySecret"
                  placeholder={
                    merchant?.razorpayKeyId
                      ? "Leave blank to keep current secret"
                      : "Enter your Razorpay Key Secret"
                  }
                  value={form.razorpayKeySecret}
                  onChange={handleChange}
                  disabled={razorpayStatus.status === "saving"}
                />
              </Field>
            </div>

            {/* Razorpay webhook info */}
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
              <strong className="font-semibold">Razorpay Webhook URL:</strong>{" "}
              <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
                https://your-domain.com/api/webhook/razorpay
              </code>
              <br />
              <span className="mt-1 block text-blue-600">
                Register this in Razorpay Dashboard → Settings → Webhooks.
                Enable the{" "}
                <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-blue-800">
                  order.paid
                </code>{" "}
                event. Copy the webhook secret to{" "}
                <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
                  RAZORPAY_WEBHOOK_SECRET
                </code>{" "}
                in your backend .env.
              </span>
            </div>

            <SectionFeedback
              status={razorpayStatus.status}
              message={razorpayStatus.message}
            />

            <div className="flex justify-end border-t pt-3">
              <SaveButton status={razorpayStatus.status} />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════ */}
      {/* Section 3: AI Context / System Prompt */}
      {/* ══════════════════════════════════════ */}

      <Card>
        <SectionHeader
          icon={Bot}
          iconClass="text-purple-600"
          bgClass="bg-purple-100"
          title="AI Assistant Configuration"
          description="Customize the Gemini AI system prompt. This context is injected into every AI conversation, teaching it about your brand, products, tone, and policies."
        />

        <Separator />

        <CardContent className="pt-5">
          <form onSubmit={handleAiSubmit} className="space-y-4">
            {/* AI Context */}
            <Field
              id="aiContext"
              label="System Prompt / AI Context"
              hint="Describe your brand, communication style, store policies, and any specific instructions for the AI. Changes take effect on the next customer message."
            >
              <Textarea
                id="aiContext"
                name="aiContext"
                placeholder={`You are a helpful shopping assistant for [Your Brand Name].
Reply in friendly Hinglish (Hindi + English mix).
Only answer questions about our products and store policies.
Always guide customers toward making a purchase.

Store policies:
- Free shipping above ₹999
- 7-day returns
- No COD, payments via UPI/Razorpay only`}
                value={form.aiContext}
                onChange={handleChange}
                disabled={aiStatus.status === "saving"}
                rows={10}
                className="resize-y font-mono text-xs leading-relaxed"
                maxLength={5000}
              />
            </Field>

            {/* Character counter */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Tip: Be specific about tone, language (English / Hinglish), and
                what topics to avoid.
              </span>
              <span
                className={cn(
                  "tabular-nums font-mono",
                  form.aiContext.length > 4500 &&
                    "text-orange-600 font-semibold",
                )}
              >
                {form.aiContext.length} / 5000
              </span>
            </div>

            <SectionFeedback
              status={aiStatus.status}
              message={aiStatus.message}
            />

            <div className="flex justify-end border-t pt-3">
              <SaveButton status={aiStatus.status} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
