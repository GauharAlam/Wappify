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
  // WhatsApp API via Twilio
  twilioAccountSid: string;
  twilioAuthToken: string;
  // Razorpay
  razorpayKeyId: string;
  razorpayKeySecret: string;
  // UPI Direct
  upiId: string;
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
    twilioAccountSid: merchant?.twilioAccountSid ?? "",
    twilioAuthToken: merchant?.twilioAuthToken ?? "",
    razorpayKeyId: merchant?.razorpayKeyId ?? "",
    razorpayKeySecret: merchant?.razorpayKeySecret ?? "",
    upiId: merchant?.upiId ?? "",
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
        name: form.name.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        twilioAccountSid: form.twilioAccountSid,
        ...(form.twilioAuthToken.trim() && !form.twilioAuthToken.includes("•")
          ? { twilioAuthToken: form.twilioAuthToken }
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
        upiId: form.upiId,
      },
      setRazorpayStatus,
      "Payment settings saved successfully!",
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
          title="Twilio WhatsApp Integration"
          description="Connect your Twilio credentials to power the WhatsApp shopping assistant."
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
              label="Twilio Sender Number"
              required
              hint="Your Twilio WhatsApp sender number (or Sandbox number) formatted like whatsapp:+14155238886."
            >
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                placeholder="whatsapp:+14155238886"
                value={form.whatsappNumber}
                onChange={handleChange}
                disabled={whatsappStatus.status === "saving"}
                maxLength={20}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Twilio Account SID */}
              <Field
                id="twilioAccountSid"
                label="Twilio Account SID"
                hint="Found on your Twilio console homepage. Looks like: ACxxxxxxxxxxxxx"
              >
                <Input
                  id="twilioAccountSid"
                  name="twilioAccountSid"
                  placeholder="ACxxxxxxxxxxxxx"
                  value={form.twilioAccountSid}
                  onChange={handleChange}
                  disabled={whatsappStatus.status === "saving"}
                  className="font-mono text-sm"
                />
              </Field>

              {/* Twilio Auth Token */}
              <Field
                id="twilioAuthToken"
                label="Twilio Auth Token"
                hint={
                  merchant?.twilioAccountSid
                    ? "A token is already saved. Paste a new one only to replace it."
                    : "Kept completely secret. Required to send WhatsApp messages."
                }
              >
                <SecretInput
                  id="twilioAuthToken"
                  name="twilioAuthToken"
                  placeholder={
                    merchant?.twilioAccountSid
                      ? "Leave blank to keep current token"
                      : "Enter your Auth Token"
                  }
                  value={form.twilioAuthToken}
                  onChange={handleChange}
                  disabled={whatsappStatus.status === "saving"}
                />
              </Field>
            </div>

            {/* Webhook info banner */}
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
              <strong className="font-semibold">Twilio Webhook URL:</strong>{" "}
              <code className="rounded bg-blue-100 px-1 py-0.5 font-mono">
                https://your-domain.com/api/webhooks/whatsapp
              </code>
              <br />
              <span className="mt-1 block text-blue-600">
                In Twilio Console → Messaging → Senders → WhatsApp senders,
                paste this URL into the <strong>"When a message comes in"</strong> field.
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
          title="Payment Configuration"
          description="Accept payments via Razorpay (cards, UPI, netbanking) or use your personal UPI ID for direct zero-cost payments."
        />

        <Separator />

        <CardContent className="pt-5">
          <form onSubmit={handleRazorpaySubmit} className="space-y-4">

            {/* ── UPI Direct Section ────────────── */}
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100">
                  <span className="text-sm">₹</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">UPI Direct — Zero Cost</p>
                  <p className="text-xs text-green-700">Accept payments via any UPI app with no gateway fees.</p>
                </div>
              </div>

              <Field
                id="upiId"
                label="Your UPI ID"
                hint="Your personal or business UPI ID (e.g. yourname@upi, business@paytm). Customers will pay directly to this."
              >
                <Input
                  id="upiId"
                  name="upiId"
                  placeholder="merchant@upi"
                  value={form.upiId}
                  onChange={handleChange}
                  disabled={razorpayStatus.status === "saving"}
                  className="font-mono text-sm bg-white"
                  maxLength={80}
                />
              </Field>
            </div>

            {/* ── Divider ─────────────────────── */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  or use Razorpay Gateway
                </span>
              </div>
            </div>

            {/* ── Razorpay Section ─────────────── */}
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

            {/* Payment method info banner */}
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <strong className="font-semibold">How it works:</strong>{" "}
              If Razorpay keys are configured, payment links are auto-generated via Razorpay.
              If only UPI ID is set, customers get a direct UPI payment link instead (zero fees).
              Razorpay takes <strong>priority</strong> when both are configured.
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
