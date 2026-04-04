import axios from "axios";

// ─────────────────────────────────────────────
// Plan Configuration
// ─────────────────────────────────────────────

export const PLAN_CONFIG = {
  STARTER: {
    name: "Starter",
    price: 2499,
    description: "For emerging D2C brands.",
    features: [
      "500 Monthly Broadcasts",
      "Basic AI Logic",
      "2 Product Catalogs",
      "Standard Support",
    ],
  },
  PRO: {
    name: "Pro",
    price: 5999,
    description: "For scaling retailers.",
    featured: true,
    features: [
      "Unlimited Broadcasts",
      "Gemini 1.5 Pro AI",
      "Unlimited Catalogs",
      "Priority Support",
      "Advanced Analytics",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 0, // Custom pricing
    description: "For large organizations.",
    features: [
      "Dedicated Account Manager",
      "Custom AI Training",
      "API Access",
      "SLA Guarantees",
      "Whitelabeling",
    ],
  },
} as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getPlatformCredentials = () => {
  const keyId = process.env.RAZORPAY_PLATFORM_KEY_ID;
  const keySecret = process.env.RAZORPAY_PLATFORM_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_PLATFORM_KEY_ID or RAZORPAY_PLATFORM_KEY_SECRET is not set in .env"
    );
  }

  return { keyId, keySecret };
};

const getRazorpayPlanId = (tier: "STARTER" | "PRO"): string => {
  const planMap: Record<string, string | undefined> = {
    STARTER: process.env.RAZORPAY_PLAN_STARTER,
    PRO: process.env.RAZORPAY_PLAN_PRO,
  };

  const planId = planMap[tier];
  if (!planId) {
    throw new Error(
      `RAZORPAY_PLAN_${tier} is not set in .env — create the plan in Razorpay Dashboard first`
    );
  }

  return planId;
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string | null;
  status: string;
  current_start: number | null;
  current_end: number | null;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, string>;
  charge_at: number | null;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at: number | null;
  source: string;
  payment_method: string;
  created_at: number;
}

// ─────────────────────────────────────────────
// Create Subscription
// ─────────────────────────────────────────────

export const createSubscription = async (params: {
  planTier: "STARTER" | "PRO";
  merchantEmail: string;
  merchantName: string;
  merchantId: string;
}): Promise<RazorpaySubscription> => {
  const { keyId, keySecret } = getPlatformCredentials();
  const planId = getRazorpayPlanId(params.planTier);

  const payload = {
    plan_id: planId,
    total_count: 120, // max billing cycles (10 years monthly)
    quantity: 1,
    customer_notify: 1,
    notes: {
      merchant_id: params.merchantId,
      merchant_name: params.merchantName,
      merchant_email: params.merchantEmail,
      plan_tier: params.planTier,
    },
  };

  console.log("[BILLING] Creating Razorpay subscription...");
  console.log("[BILLING] Plan Tier  :", params.planTier);
  console.log("[BILLING] Plan ID    :", planId);
  console.log("[BILLING] Merchant   :", params.merchantName);

  try {
    const response = await axios.post<RazorpaySubscription>(
      "https://api.razorpay.com/v1/subscriptions",
      payload,
      {
        auth: { username: keyId, password: keySecret },
        headers: { "Content-Type": "application/json" },
      }
    );

    const sub = response.data;
    console.log("[BILLING] ✅ Subscription created:", sub.id);
    console.log("[BILLING] Short URL  :", sub.short_url);
    console.log("[BILLING] Status     :", sub.status);

    return sub;
  } catch (error: any) {
    const errData = error?.response?.data || error?.message || error;
    console.error(
      "[BILLING ERROR] Failed to create subscription:",
      JSON.stringify(errData, null, 2)
    );
    throw new Error(
      `Razorpay subscription creation failed: ${JSON.stringify(errData)}`
    );
  }
};

// ─────────────────────────────────────────────
// Cancel Subscription
// ─────────────────────────────────────────────

export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtCycleEnd = true
): Promise<RazorpaySubscription> => {
  const { keyId, keySecret } = getPlatformCredentials();

  console.log("[BILLING] Cancelling subscription:", subscriptionId);
  console.log("[BILLING] Cancel at cycle end:", cancelAtCycleEnd);

  try {
    const response = await axios.post<RazorpaySubscription>(
      `https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`,
      { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 },
      {
        auth: { username: keyId, password: keySecret },
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("[BILLING] ✅ Subscription cancelled:", response.data.status);
    return response.data;
  } catch (error: any) {
    const errData = error?.response?.data || error?.message || error;
    console.error(
      "[BILLING ERROR] Failed to cancel subscription:",
      JSON.stringify(errData, null, 2)
    );
    throw new Error(
      `Razorpay subscription cancellation failed: ${JSON.stringify(errData)}`
    );
  }
};

// ─────────────────────────────────────────────
// Fetch Subscription
// ─────────────────────────────────────────────

export const fetchSubscription = async (
  subscriptionId: string
): Promise<RazorpaySubscription> => {
  const { keyId, keySecret } = getPlatformCredentials();

  try {
    const response = await axios.get<RazorpaySubscription>(
      `https://api.razorpay.com/v1/subscriptions/${subscriptionId}`,
      {
        auth: { username: keyId, password: keySecret },
      }
    );

    return response.data;
  } catch (error: any) {
    const errData = error?.response?.data || error?.message || error;
    console.error(
      "[BILLING ERROR] Failed to fetch subscription:",
      JSON.stringify(errData, null, 2)
    );
    throw new Error(
      `Razorpay subscription fetch failed: ${JSON.stringify(errData)}`
    );
  }
};
