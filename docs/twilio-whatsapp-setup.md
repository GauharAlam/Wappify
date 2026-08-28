# Twilio WhatsApp setup

Wappify uses one Twilio WhatsApp sender for inbound conversations, AI replies, and dashboard broadcasts. Twilio credentials stay in the backend; the dashboard only uses a shared server-to-server token.

## 1. Configure Twilio

1. Create a Twilio account and enable WhatsApp for the sender you will use. For development, join the [Twilio WhatsApp Sandbox](https://www.twilio.com/docs/whatsapp/sandbox). For production, complete Twilio's WhatsApp sender onboarding.
2. In the Twilio Console, open the WhatsApp sender configuration and set **When a message comes in** to:

   ```text
   https://<backend-domain>/api/webhooks/whatsapp
   ```

   Choose `POST`. The URL must be HTTPS in production and must exactly match `TWILIO_WEBHOOK_URL`, including any path and query string.
3. Copy the Account SID and Auth Token from the Twilio Console. Treat the Auth Token like a password.

## 2. Configure environment variables

In `wappify-backend/.env`:

```dotenv
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=14155238886
TWILIO_WEBHOOK_URL=https://<backend-domain>/api/webhooks/whatsapp
BACKEND_INTERNAL_API_TOKEN=<a-long-random-shared-secret>
```

`TWILIO_WHATSAPP_NUMBER` is the Twilio WhatsApp sender in E.164 format, without `whatsapp:`. Wappify adds that prefix when calling Twilio.

In `wappify-dashboard/.env.local`:

```dotenv
BACKEND_API_URL=https://<backend-domain>
BACKEND_INTERNAL_API_TOKEN=<the-same-long-random-shared-secret>
```

Do not expose either token with a `NEXT_PUBLIC_` prefix and never commit real values.

## 3. Run and verify

1. Start the backend and dashboard.
2. Send a WhatsApp message to the Twilio sender. Twilio signs the form webhook; Wappify validates its `X-Twilio-Signature` before writing the event to `WebhookEvent`.
3. Confirm the backend logs `Event queued`, then confirm an AI reply arrives.
4. Send a dashboard broadcast. The dashboard calls the protected backend endpoint, `POST /api/messages`, which sends through Twilio and increments the organization message count.

The backend returns `401` for a missing or mismatched internal token and rejects unsigned or invalid Twilio webhook requests.

## Broadcast and production notes

- WhatsApp allows free-form replies only during the customer service window after a customer message. Outside that window, broadcasts must use an approved WhatsApp template. This implementation sends text messages; add Twilio template/content support before scheduling campaigns outside the window.
- The Twilio sandbox is for testing only. Recipients must join the sandbox and production traffic requires an approved sender.
- Use a publicly reachable HTTPS backend URL. For local testing, use a secure tunnel and set `TWILIO_WEBHOOK_URL` to its exact public URL.
- Rotate `TWILIO_AUTH_TOKEN` and `BACKEND_INTERNAL_API_TOKEN` wherever they are configured if either is exposed.

## Implementation map

- `wappify-backend/src/services/twilioWhatsapp.service.ts` sends WhatsApp messages and validates Twilio signatures using the official Twilio Node SDK.
- `wappify-backend/src/controllers/whatsappWebhook.controller.ts` accepts signed inbound form webhooks and persists them in the existing durable queue.
- `wappify-backend/src/services/queueProcessor.service.ts` converts Twilio payloads into the existing AI routing flow.
- `wappify-backend/src/controllers/messages.controller.ts` exposes the internal send endpoint used by dashboard broadcasts.
