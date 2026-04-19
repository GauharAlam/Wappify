import crypto from "crypto";
import { Request, Response } from "express";
import { markOrderAsPaid } from "../services/order.service";
import { sendTextMessage } from "../services/whatsapp.service";

// ─────────────────────────────────────────────
// Signature Verification
// Razorpay signs every webhook payload with HMAC SHA256
// using your Webhook Secret from the Razorpay Dashboard.
// The raw Buffer body MUST be used here — not parsed JSON.
// ─────────────────────────────────────────────

const verifyRazorpaySignature = (rawBody: Buffer, signature: string): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      "[RAZORPAY WEBHOOK] ⚠️  RAZORPAY_WEBHOOK_SECRET is not set — skipping signature check (dev mode only)"
    );
    return true;
  }

  if (!signature) {
    console.warn("[RAZORPAY WEBHOOK] ❌ No X-Razorpay-Signature header present in request");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const isValid = expectedSignature === signature;

  if (!isValid) {
    console.warn("[RAZORPAY WEBHOOK] ❌ Signature mismatch — possible spoofed request");
    console.warn("[RAZORPAY WEBHOOK] Expected :", expectedSignature);
    console.warn("[RAZORPAY WEBHOOK] Received :", signature);
  } else {
    console.log("[RAZORPAY WEBHOOK] ✅ Signature verified successfully");
  }

  return isValid;
};

// ─────────────────────────────────────────────
// POST /api/webhooks/razorpay
// ─────────────────────────────────────────────

export const receiveRazorpayWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const signature = req.header("x-razorpay-signature") || "";
  const rawBody = req.body as Buffer;

  console.log("\n================ RAZORPAY WEBHOOK RECEIVED ================");
  console.log("[RAZORPAY WEBHOOK] Timestamp :", new Date().toISOString());
  console.log("[RAZORPAY WEBHOOK] Signature :", signature || "N/A");

  // ── Step 1: Verify signature ──────────────────────────────
  if (!verifyRazorpaySignature(rawBody, signature)) {
    res.status(400).json({ success: false, message: "Invalid webhook signature" });
    return;
  }

  // ── Step 2: Parse raw body to JSON ────────────────────────
  let event: any;
  try {
    event = JSON.parse(rawBody.toString("utf-8"));
  } catch (parseError) {
    console.error("[RAZORPAY WEBHOOK] ❌ Failed to parse raw body as JSON:", parseError);
    res.status(400).json({ success: false, message: "Invalid JSON body" });
    return;
  }

  console.log("[RAZORPAY WEBHOOK] Event Type :", event?.event || "unknown");
  console.log("[RAZORPAY WEBHOOK] Account ID :", event?.account_id || "N/A");
  console.log(
    "[RAZORPAY WEBHOOK] Payload    :\n",
    JSON.stringify(event?.payload, null, 2)
  );
  console.log("==========================================================\n");

  // ── Step 3: Acknowledge immediately (200) ─────────────────
  // Razorpay will retry for up to 24 hours if it doesn't get a 200.
  // Always respond before doing any async DB/API work.
  res.status(200).json({ success: true, message: "Webhook received" });

  // ── Step 4: Handle event types ────────────────────────────
  try {
    switch (event?.event) {
      // ── payment_link.paid ────────────────────────────────
      case "payment_link.paid": {
        console.log("[RAZORPAY WEBHOOK] Handling: payment_link.paid");

        const paymentLinkEntity = event?.payload?.payment_link?.entity;
        const paymentEntity = event?.payload?.payment?.entity;

        const razorpayPaymentLinkId: string = paymentLinkEntity?.id || "";
        const razorpayPaymentId: string = paymentEntity?.id || "";
        const amountPaidPaise: number = paymentEntity?.amount ?? 0;
        const currency: string = paymentEntity?.currency || "INR";
        const method: string = paymentEntity?.method || "N/A";

        console.log("[RAZORPAY WEBHOOK] Payment Link ID :", razorpayPaymentLinkId);
        console.log("[RAZORPAY WEBHOOK] Payment ID      :", razorpayPaymentId);
        console.log(
          "[RAZORPAY WEBHOOK] Amount Paid     :",
          `₹${amountPaidPaise / 100} ${currency}`
        );
        console.log("[RAZORPAY WEBHOOK] Payment Method  :", method);

        if (!razorpayPaymentLinkId || !razorpayPaymentId) {
          console.warn(
            "[RAZORPAY WEBHOOK] Missing payment link ID or payment ID — cannot process"
          );
          break;
        }

        // Update order status to PAID in DB
        const updatedOrder = await markOrderAsPaid(
          razorpayPaymentLinkId,
          razorpayPaymentId
        );

        if (!updatedOrder) {
          console.warn(
            `[RAZORPAY WEBHOOK] No matching order found for payment link: ${razorpayPaymentLinkId}`
          );
          break;
        }

        console.log(
          `[RAZORPAY WEBHOOK] ✅ Order ${updatedOrder.id} successfully marked as PAID`
        );

        // Build order summary for WhatsApp confirmation
        const customerWaId = updatedOrder.customer.waId;
        const customerName = updatedOrder.customer.name || "";

        const itemSummary = updatedOrder.items
          .map(
            (item: any) =>
              `  • ${item.quantity}x ${item.product.name} — ₹${Number(item.priceAtTime) * item.quantity}`
          )
          .join("\n");

        const shortOrderId = updatedOrder.id.slice(0, 8).toUpperCase();

        const confirmationMessage = [
          `✅ *Payment Confirmed!* 🎉`,
          ``,
          `Bahut shukriya ${customerName}! Aapka payment successfully receive ho gaya hai.`,
          ``,
          `🧾 *Order Details:*`,
          `Order ID : #${shortOrderId}`,
          ``,
          `📦 Items:`,
          itemSummary,
          ``,
          `💰 Total Paid: ₹${Number(updatedOrder.totalAmount)} ${currency}`,
          `🏦 Payment via: ${method.toUpperCase()}`,
          ``,
          `🚚 Aapka order *3-5 business days* mein deliver ho jayega!`,
          ``,
          `Koi sawaal ho toh yahan message karein — hum hamesha available hain. 😊`,
        ].join("\n");

        await sendTextMessage(updatedOrder.merchantId, customerWaId, confirmationMessage);

        console.log(
          `[RAZORPAY WEBHOOK] ✅ Confirmation message sent to customer: ${customerWaId}`
        );
        break;
      }

      // ── payment_link.cancelled ────────────────────────────
      case "payment_link.cancelled": {
        console.log("[RAZORPAY WEBHOOK] Handling: payment_link.cancelled");
        const linkId: string =
          event?.payload?.payment_link?.entity?.id || "unknown";
        console.log(`[RAZORPAY WEBHOOK] Payment link ${linkId} was cancelled`);
        // TODO: Update order status to CANCELLED in a future step
        break;
      }

      // ── payment.failed ────────────────────────────────────
      case "payment.failed": {
        console.warn("[RAZORPAY WEBHOOK] Handling: payment.failed");
        const failedPaymentId: string =
          event?.payload?.payment?.entity?.id || "unknown";
        const errorDescription: string =
          event?.payload?.payment?.entity?.error_description || "Unknown error";
        console.warn(
          `[RAZORPAY WEBHOOK] Payment ${failedPaymentId} failed: ${errorDescription}`
        );
        // TODO: Notify customer of failure via WhatsApp in a future step
        break;
      }

      // ── Unhandled event types ─────────────────────────────
      default: {
        console.log(
          `[RAZORPAY WEBHOOK] Unhandled event type: "${event?.event}" — logged and ignored`
        );
        break;
      }
    }
  } catch (processingError: any) {
    // We've already sent 200 to Razorpay, so we just log here.
    // Razorpay will NOT retry since it got a 200.
    console.error(
      "[RAZORPAY WEBHOOK] ❌ Error while processing event after acknowledgement:"
    );
    console.error("[RAZORPAY WEBHOOK] Message:", processingError?.message || "Unknown error");
    console.error("[RAZORPAY WEBHOOK] Stack  :", processingError?.stack || "No stack");
  }
};
