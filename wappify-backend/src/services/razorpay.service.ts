import axios from "axios";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export interface CreatePaymentLinkParams {
  amountInRupees: number;
  currency?: string;
  orderId: string;
  customerPhone: string;
  customerName?: string;
  description: string;
  credentials?: RazorpayCredentials;
}

export interface RazorpayPaymentLink {
  id: string;
  short_url: string;
  amount: number;
  currency: string;
  status: string;
  reference_id: string;
  description: string;
  expire_by: number;
  created_at: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getRazorpayCredentials = (override?: RazorpayCredentials): { keyId: string; keySecret: string } => {
  if (override?.keyId && override?.keySecret) {
    return override;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured for this merchant and RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set in .env"
    );
  }

  return { keyId, keySecret };
};

// Razorpay works in paise (1 INR = 100 paise)
const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

// Payment links expire in 24 hours by default
const getExpiryTimestamp = (hoursFromNow = 24): number =>
  Math.floor(Date.now() / 1000) + hoursFromNow * 60 * 60;

// ─────────────────────────────────────────────
// Create Payment Link
// ─────────────────────────────────────────────

export const createPaymentLink = async (
  params: CreatePaymentLinkParams
): Promise<RazorpayPaymentLink> => {
  const { keyId, keySecret } = getRazorpayCredentials(params.credentials);
  const baseUrl = process.env.BASE_URL;

  const amountInPaise = rupeesToPaise(params.amountInRupees);

  const payload: Record<string, unknown> = {
    amount: amountInPaise,
    currency: params.currency || "INR",
    description: params.description,
    reference_id: params.orderId,
    customer: {
      contact: params.customerPhone.startsWith("+")
        ? params.customerPhone
        : `+91${params.customerPhone}`,
      name: params.customerName || "Customer",
    },
    // We handle notification via WhatsApp ourselves
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: false,
    expire_by: getExpiryTimestamp(24),
  };

  // Only attach callback if BASE_URL is configured
  if (baseUrl) {
    payload.callback_url = `${baseUrl}/api/webhooks/razorpay`;
    payload.callback_method = "get";
  }

  console.log("[RAZORPAY] Creating payment link...");
  console.log("[RAZORPAY] Reference (Order ID) :", params.orderId);
  console.log("[RAZORPAY] Amount (paise)        :", amountInPaise);
  console.log("[RAZORPAY] Customer Phone        :", params.customerPhone);

  try {
    const response = await axios.post<RazorpayPaymentLink>(
      "https://api.razorpay.com/v1/payment_links",
      payload,
      {
        auth: {
          username: keyId,
          password: keySecret,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const link = response.data;

    console.log("[RAZORPAY] ✅ Payment link created successfully");
    console.log("[RAZORPAY] Link ID   :", link.id);
    console.log("[RAZORPAY] Short URL :", link.short_url);
    console.log("[RAZORPAY] Status    :", link.status);

    return link;
  } catch (error: any) {
    const errData = error?.response?.data || error?.message || error;
    console.error(
      "[RAZORPAY ERROR] Failed to create payment link:",
      JSON.stringify(errData, null, 2)
    );
    throw new Error(
      `Razorpay payment link creation failed: ${JSON.stringify(errData)}`
    );
  }
};

// ─────────────────────────────────────────────
// Fetch Payment Link (for status polling)
// ─────────────────────────────────────────────

export const fetchPaymentLink = async (
  paymentLinkId: string,
  credentials?: RazorpayCredentials
): Promise<RazorpayPaymentLink> => {
  const { keyId, keySecret } = getRazorpayCredentials(credentials);

  console.log("[RAZORPAY] Fetching payment link:", paymentLinkId);

  try {
    const response = await axios.get<RazorpayPaymentLink>(
      `https://api.razorpay.com/v1/payment_links/${paymentLinkId}`,
      {
        auth: {
          username: keyId,
          password: keySecret,
        },
      }
    );

    console.log("[RAZORPAY] Link status:", response.data.status);
    return response.data;
  } catch (error: any) {
    const errData = error?.response?.data || error?.message || error;
    console.error(
      "[RAZORPAY ERROR] Failed to fetch payment link:",
      JSON.stringify(errData, null, 2)
    );
    throw new Error(
      `Razorpay fetch failed: ${JSON.stringify(errData)}`
    );
  }
};
