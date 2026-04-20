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
Meta demands webhook acknowledgments within 20 seconds, but AI processing (Gemini) can take longer. 
To prevent timeouts, the webhook route simply saves the raw event to the database and responds with `200 OK` instantly (<20ms). A background worker constantly polls the database, processes the AI logic, and dispatches the Meta send API requests.

---

## 🚨 Current Flaws to Fix Before Launch

Since this was "vibe-coded", there are a few bottlenecks that will break under load:
1. **In-Memory Cache:** The `customerMerchantMap` in `queueProcessor.service.ts` is an in-memory `Map`. If you host this on Vercel/Render with multiple worker instances, the cache won't be shared. It must be moved to **Redis**.
2. **Database Polling Race Conditions:** The queue processor uses a 2-second `setInterval` to find pending jobs. If 3 workers spawn, they will read the same un-updated row and process it 3 times. We need a proper lock mechanism (`SELECT FOR UPDATE SKIP LOCKED` or BullMQ).

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
WHATSAPP_VERIFY_TOKEN="your_custom_secret_string_for_meta"
WHATSAPP_ACCESS_TOKEN="EAAxxxxxx..." # Long-lived access token from Meta
WHATSAPP_PHONE_NUMBER_ID="1234567890123"
WHATSAPP_BUSINESS_NUMBER="919876543210" # Public facing number
GEMINI_API_KEY="AIzaSy..."
DASHBOARD_URL="https://your-dashboard-domain.com"
```

#### Dashboard `.env`
```env
DATABASE_URL="postgresql://user:password@cloud-db.com/db"
DIRECT_URL="postgresql://user:password@cloud-db.com/db"
NEXTAUTH_URL="https://your-dashboard-domain.com"
NEXTAUTH_SECRET="a_very_long_random_string"
```

### 3. Setting Up Meta App
1. Go to **Meta for Developers**. Create a "Business" app.
2. Add the **WhatsApp Product**.
3. Generate a **System User Access Token** (never-expiring) instead of the temporary 24-hour token.
4. Set up the Webhook API. Provide your backend URL: `https://your-backend-api.com/api/webhooks/whatsapp`. Give it your `WHATSAPP_VERIFY_TOKEN`.
5. Subscribe to the `messages` event.

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
