# Wappify production launch runbook

## Release blockers to complete outside this repository

1. Create fresh Supabase connection strings from **Supabase → Connect**. The current connection is rejected by Supabase and cannot be repaired from application code.
2. Rotate every database, Meta, Gemini, Razorpay, and Clerk credential that has been copied into a local environment or shared outside the provider dashboard.
3. Configure the Meta WhatsApp callback URL as:

   ```text
   https://<backend-domain>/api/webhooks/whatsapp
   ```

   Do not use the dashboard's deprecated `/api/webhook/whatsapp` POST endpoint.
4. Create a Redis instance that is reachable by the backend, then set `REDIS_URL`.
5. Use a continuously running Render web service. The Blueprint now uses Render's `starter` plan instead of the free plan.

## Required production environment variables

Set these in Render's encrypted environment-variable settings; never commit them.

```text
DATABASE_URL
DIRECT_URL
REDIS_URL
WHATSAPP_VERIFY_TOKEN
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_NUMBER
META_APP_SECRET
GEMINI_API_KEY
RAZORPAY_WEBHOOK_SECRET
DASHBOARD_URL
```

`META_APP_SECRET` is the Meta app secret used to verify `X-Hub-Signature-256`. Production startup deliberately fails if it, Redis, or any other required core integration is missing.

## Database rollout

The webhook reliability schema change adds a Meta event id, retry count, retry time, and queue index.

For an existing database created by the current app, Render executes this automatically before deployment:

```bash
npx prisma migrate deploy
```

For a brand-new empty development database, initialize the current schema once with `npx prisma db push`, then use migrations for future changes. Never use `db push` as an uncontrolled production deployment step.

## Verify the deployment

```bash
curl https://<backend-domain>/health
curl https://<backend-domain>/health/ready
```

`/health/ready` must report both `database` and `redis` as `true` before configuring traffic or webhooks.

In Meta's webhook console, verify the GET challenge and send a test webhook. The endpoint must reject an unsigned POST with `401`, accept a correctly signed event with `200`, and process the queued event exactly once.

## Operational requirements

- Enable database backups and test a restore procedure.
- Add uptime monitoring for `/health/ready` and alert on HTTP 5xx errors.
- Alert on webhook events with status `FAILED` and inspect them before retrying manually.
- Do not set `ENABLE_DEMO_SEED=true` in production; production code ignores it even if set.
- Run dependency upgrades and security checks before public launch.
- Add automated tests for webhook signature verification, queue retry/backoff, tenant isolation, payment idempotency, and role permissions before opening a public beta.
