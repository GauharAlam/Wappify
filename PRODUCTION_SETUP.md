# Wappify - Production Setup & Architecture Guide

Welcome! Since this project was built via "vibe coding," it has a very functional but slightly fragile foundation. This guide explains **how Wappify works under the hood** and provides the **step-by-step instructions to deploy it** securely and reliably in a production environment.

---

## 🏗️ How Wappify Actually Works (Under the Hood)

Wappify uses a **Multi-Tenant, Single-Phone-Number Architecture**. 

### 1. The Core Flow
Instead of every merchant having to verify their own WhatsApp Business API, **Wappify owns one global WhatsApp Business Number**. Customers from all merchants message this single number.

### 2. Store-Code Routing (The Magic)
When a customer clicks a merchant's custom link (e.g., `https://wa.me/919876543210?text=STORE-STYLE123`), their very first message to Wappify contains the code `STORE-STYLE123`.
- The webhook receiver (`whatsappWebhook.controller.ts`) gets the message and saves it to a PostgreSQL queue table (`WebhookEvent`).
- The async queue processor (`queueProcessor.service.ts`) picks it up, sees `STORE-STYLE123`, and matches it to a Merchant ID in the database.
- It then saves this `customer_number -> merchant_id` mapping so all future messages from this customer automatically route to the correct merchant's AI context.

### 3. Decoupled AI Processing
Twilio requires prompt webhook acknowledgments, but AI processing (Gemini) can take longer.
To prevent timeouts, the webhook route validates and saves the signed Twilio event to the database, then responds with `200 OK` immediately. A background worker polls the database, processes the AI logic, and dispatches Twilio WhatsApp API requests.

---

## ✅ Production Hardening Completed

The following bottlenecks have already been addressed for production deployment:
1. **Redis Caching:** The in-memory map in `queueProcessor.service.ts` has been replaced with **Redis** to support scaling with multiple worker instances.
2. **Database Polling Race Conditions:** A `SELECT FOR UPDATE SKIP LOCKED` mechanism has been implemented on the Postgres queue so multiple background workers can safely poll without processing the same job twice.

---

## 🚀 Production Deployment Checklist

### 1. Platform Requirements
- **Frontend (Dashboard):** Deploy on **Vercel** for optimal Next.js performance.
- **Backend (Worker/Engine):** Deploy on **Render** (Background Worker or Web Service) or an AWS EC2 instance. The backend needs to run continuously to poll the async queue.
- **Database:** Supabase (PostgreSQL) or Aiven.
- **Caching/Queue:** Upstash (Serverless Redis) for tracking sessions and rate limits.

### 2. Required API Keys (.env)

#### Backend `.env`
```env
PORT=8080
DATABASE_URL="postgresql://user:password@cloud-db.com/db?pgbouncer=true"
DIRECT_URL="postgresql://user:password@cloud-db.com/db"
TWILIO_ACCOUNT_SID="ACxxxxxx..."
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="14155238886" # Public-facing Twilio sender
TWILIO_WEBHOOK_URL="https://your-backend-api.com/api/webhooks/whatsapp"
BACKEND_INTERNAL_API_TOKEN="a_long_random_shared_secret"
GEMINI_API_KEY="AIzaSy..."
DASHBOARD_URL="https://your-dashboard-domain.com"
```

#### Dashboard `.env`
```env
DATABASE_URL="postgresql://user:password@cloud-db.com/db"
DIRECT_URL="postgresql://user:password@cloud-db.com/db"
NEXTAUTH_URL="https://your-dashboard-domain.com"
NEXTAUTH_SECRET="a_very_long_random_string"
BACKEND_API_URL="https://your-backend-api.com"
BACKEND_INTERNAL_API_TOKEN="the_same_long_random_shared_secret"
```

### 3. Setting Up Twilio WhatsApp
1. Create or configure a Twilio WhatsApp sender (use the sandbox for development).
2. Set **When a message comes in** to `https://your-backend-api.com/api/webhooks/whatsapp` with `POST`.
3. Set `TWILIO_WEBHOOK_URL` to that exact URL. Wappify verifies Twilio's `X-Twilio-Signature` on every incoming webhook.
4. Keep `BACKEND_INTERNAL_API_TOKEN` identical in the backend and dashboard, but never expose it to the browser.
5. See [the detailed Twilio setup guide](docs/twilio-whatsapp-setup.md) for verification and broadcast requirements.

### 4. Setting up Razorpay Webhooks
In Razorpay Developer Console, configure webhooks to hit:
`https://your-backend-api.com/api/webhooks/razorpay` 
with events like `order.paid`.

### 5. Deployment Flow
1. **Push Dashboard:** Connect your GitHub repo to Vercel, set root directory to `wappify-dashboard`.
2. **Push Backend:** Connect repo to Render. Set root to `wappify-backend`. Build Command: `npm install && npm run build`. Start Command: `npm start`.
3. **Run Prisma Migrations:** Execute `npx prisma db push` (or `migrate deploy`) on production DB.

---

## 📈 Next Steps

Review the AI-generated implementation plan for instructions on improving the codebase (adding Redis, improving the queue, API expansions) prior to the launch launch!
