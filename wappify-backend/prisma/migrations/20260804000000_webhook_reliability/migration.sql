-- Adds idempotency and retry state to the existing webhook queue.
-- This migration is intentionally idempotent for databases previously created with prisma db push.

ALTER TABLE "WebhookEvent"
  ADD COLUMN IF NOT EXISTS "externalEventId" TEXT,
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_externalEventId_key"
  ON "WebhookEvent"("externalEventId");

CREATE INDEX IF NOT EXISTS "WebhookEvent_status_nextAttemptAt_createdAt_idx"
  ON "WebhookEvent"("status", "nextAttemptAt", "createdAt");
