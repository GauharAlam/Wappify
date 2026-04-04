"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Crown,
  Building2,
  Loader2,
  ExternalLink,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SubscriptionData {
  id: string;
  planTier: string;
  planName: string;
  planPrice: number;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

interface BillingStatusResponse {
  success: boolean;
  hasSubscription: boolean;
  subscription: SubscriptionData | null;
}

// ─────────────────────────────────────────────
// Plan Config (mirrors server)
// ─────────────────────────────────────────────

const PLANS = [
  {
    tier: "STARTER",
    name: "Starter",
    price: "₹2,499",
    priceNum: 2499,
    description: "For emerging D2C brands.",
    icon: Zap,
    color: "emerald",
    features: [
      "500 Monthly Broadcasts",
      "Basic AI Logic",
      "2 Product Catalogs",
      "Standard Support",
    ],
  },
  {
    tier: "PRO",
    name: "Pro",
    price: "₹5,999",
    priceNum: 5999,
    description: "For scaling retailers.",
    icon: Crown,
    color: "violet",
    featured: true,
    features: [
      "Unlimited Broadcasts",
      "Gemini 1.5 Pro AI",
      "Unlimited Catalogs",
      "Priority Support",
      "Advanced Analytics",
    ],
  },
  {
    tier: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    priceNum: 0,
    description: "For large organizations.",
    icon: Building2,
    color: "amber",
    features: [
      "Dedicated Account Manager",
      "Custom AI Training",
      "API Access",
      "SLA Guarantees",
      "Whitelabeling",
    ],
  },
];

// ─────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; className: string; icon: typeof CheckCircle2 }
  > = {
    ACTIVE: {
      label: "Active",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: CheckCircle2,
    },
    CREATED: {
      label: "Awaiting Payment",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      icon: Clock,
    },
    AUTHENTICATED: {
      label: "Authenticated",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: CheckCircle2,
    },
    PENDING: {
      label: "Payment Pending",
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      icon: AlertTriangle,
    },
    HALTED: {
      label: "Payment Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      icon: XCircle,
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
      icon: XCircle,
    },
    EXPIRED: {
      label: "Expired",
      className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
      icon: Clock,
    },
    PAUSED: {
      label: "Paused",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: Clock,
    },
  };

  const c = config[status] || config.CREATED;
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        c.className
      )}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Billing Page
// ─────────────────────────────────────────────

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch billing status ──────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      const data: BillingStatusResponse = await res.json();
      if (data.success) {
        setHasSubscription(data.hasSubscription);
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error("Failed to fetch billing status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Subscribe handler ─────────────────────
  const handleSubscribe = async (tier: string) => {
    if (tier === "ENTERPRISE") {
      window.open("mailto:sales@wappify.in?subject=Enterprise Plan Inquiry", "_blank");
      return;
    }

    setActionLoading(tier);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier: tier }),
      });

      const data = await res.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.message || "Failed to create subscription");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Cancel handler ────────────────────────
  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period."
      )
    ) {
      return;
    }

    setActionLoading("cancel");
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        await fetchStatus();
      } else {
        alert(data.message || "Failed to cancel subscription");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading state ─────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive =
    subscription &&
    ["ACTIVE", "AUTHENTICATED"].includes(subscription.status);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── Page Header ────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Billing & Plans
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and billing settings.
          </p>
        </div>
      </div>

      {/* ── Current Plan Card ──────────────── */}
      {hasSubscription && subscription && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Left — Plan info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">Current Plan</h2>
                <StatusBadge status={subscription.status} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">
                  {subscription.planName}
                </span>
                {subscription.planPrice > 0 && (
                  <span className="text-sm text-muted-foreground font-medium">
                    ₹{subscription.planPrice.toLocaleString("en-IN")}/month
                  </span>
                )}
              </div>

              {subscription.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {subscription.status === "CANCELLED" ? (
                    <>
                      Access until{" "}
                      <span className="font-semibold text-foreground">
                        {new Date(
                          subscription.currentPeriodEnd
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </>
                  ) : (
                    <>
                      Next billing on{" "}
                      <span className="font-semibold text-foreground">
                        {new Date(
                          subscription.currentPeriodEnd
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </>
                  )}
                </p>
              )}

              {subscription.cancelledAt && (
                <p className="text-sm text-orange-600 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Cancelled on{" "}
                  {new Date(subscription.cancelledAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              )}
            </div>

            {/* Right — Actions */}
            <div className="flex gap-3">
              {isActive && (
                <Button
                  variant="outline"
                  className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={handleCancel}
                  disabled={actionLoading === "cancel"}
                >
                  {actionLoading === "cancel" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cancel Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── No Subscription Banner ─────────── */}
      {!hasSubscription && (
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-violet-500/5 p-8">
          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-muted-foreground max-w-md font-medium">
              Start your 14-day free trial today. No credit card required.
              Upgrade anytime to unlock powerful features.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-0" />
        </div>
      )}

      {/* ── Plan Comparison Grid ───────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan =
            hasSubscription && subscription?.planTier === plan.tier;
          const canSubscribe =
            !isActive || subscription?.planTier !== plan.tier;

          return (
            <div
              key={plan.tier}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
                plan.featured
                  ? "border-primary/50 bg-primary/[0.02] shadow-lg shadow-primary/5 ring-1 ring-primary/10"
                  : "bg-card hover:border-primary/20 hover:shadow-md",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {/* Featured badge */}
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {isCurrentPlan && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Current
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6 space-y-4">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    plan.color === "emerald" &&
                      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                    plan.color === "violet" &&
                      "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
                    plan.color === "amber" &&
                      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  {plan.priceNum > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm font-medium"
                  >
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        plan.featured
                          ? "text-primary"
                          : "text-emerald-500"
                      )}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {plan.tier === "ENTERPRISE" ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl font-bold"
                  onClick={() => handleSubscribe("ENTERPRISE")}
                >
                  Contact Sales
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              ) : isCurrentPlan && isActive ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl font-bold"
                  disabled
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Current Plan
                </Button>
              ) : (
                <Button
                  className={cn(
                    "w-full rounded-xl font-bold transition-all",
                    plan.featured
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-foreground hover:bg-foreground/90 text-background"
                  )}
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={actionLoading === plan.tier}
                >
                  {actionLoading === plan.tier ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {hasSubscription ? "Switch to " + plan.name : "Start Free Trial"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FAQ / Info Section ──────────────── */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Billing FAQ</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              q: "When will I be charged?",
              a: "Your 14-day free trial starts immediately. You'll only be charged after the trial ends.",
            },
            {
              q: "Can I switch plans?",
              a: "Yes! You can upgrade or downgrade anytime. Changes take effect at the next billing cycle.",
            },
            {
              q: "How do I cancel?",
              a: "Click 'Cancel Plan' above. You'll retain access until the end of your current billing period.",
            },
            {
              q: "What payment methods are accepted?",
              a: "We accept all major cards, UPI, net banking, and wallets through Razorpay.",
            },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-sm font-bold">{item.q}</p>
              <p className="text-sm text-muted-foreground font-medium">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
