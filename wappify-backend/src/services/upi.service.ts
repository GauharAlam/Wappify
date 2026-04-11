// ─────────────────────────────────────────────
// UPI Direct Payment Service
//
// Generates UPI deep links that work with any UPI
// app (GPay, PhonePe, Paytam, BHIM, etc).
// ZERO gateway fees — payments go directly to
// the merchant's UPI ID.
// ─────────────────────────────────────────────

export interface UpiPaymentParams {
  upiId: string;
  merchantName: string;
  amountInRupees: number;
  orderId: string;
  productName: string;
}

export interface UpiPaymentLink {
  deepLink: string;
  displayUrl: string;
  orderId: string;
}

/**
 * Generates a UPI deep link for direct payment.
 *
 * Format: upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>&tr=<REF>
 *
 * - pa = Payee VPA (merchant@upi)
 * - pn = Payee Name
 * - am = Amount
 * - cu = Currency (INR)
 * - tn = Transaction Note
 * - tr = Transaction Reference ID (our order ID)
 */
export const generateUpiPaymentLink = (
  params: UpiPaymentParams
): UpiPaymentLink => {
  const { upiId, merchantName, amountInRupees, orderId, productName } = params;

  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  const transactionNote = `${merchantName} - ${productName} (#${shortOrderId})`;

  // Build UPI deep link
  const deepLink = [
    `upi://pay`,
    `?pa=${encodeURIComponent(upiId)}`,
    `&pn=${encodeURIComponent(merchantName)}`,
    `&am=${amountInRupees.toFixed(2)}`,
    `&cu=INR`,
    `&tn=${encodeURIComponent(transactionNote)}`,
    `&tr=${encodeURIComponent(orderId)}`,
  ].join("");

  console.log("[UPI SERVICE] Generated UPI payment link:");
  console.log("[UPI SERVICE] Merchant UPI :", upiId);
  console.log("[UPI SERVICE] Amount       :", `₹${amountInRupees}`);
  console.log("[UPI SERVICE] Order ID     :", shortOrderId);
  console.log("[UPI SERVICE] Deep Link    :", deepLink);

  return {
    deepLink,
    displayUrl: deepLink,
    orderId,
  };
};
