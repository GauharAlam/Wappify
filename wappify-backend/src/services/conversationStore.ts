import { Content } from "@google/generative-ai";
import { redis } from "../lib/redis";

// ─────────────────────────────────────────────
// Redis-backed conversation store with memory fallback
// Keyed by WhatsApp ID → array of Gemini Content.
// Persists user session across server reboots.
// ─────────────────────────────────────────────

const MAX_MESSAGES_PER_CONVERSATION = 10;
const CONVERSATION_TTL_SECONDS = 60 * 60; // 1 hour

// In-memory fallback in case Redis is offline or degraded
const memoryFallback = new Map<string, Content[]>();

const getRedisKey = (waId: string) => `convo:${waId}`;

/**
 * Returns the conversation history for a given WhatsApp ID.
 * Retrieves from Redis with in-memory fallback.
 */
export const getConversationHistory = async (waId: string): Promise<Content[]> => {
  try {
    const raw = await redis.get(getRedisKey(waId));
    if (raw) {
      return JSON.parse(raw) as Content[];
    }
  } catch (err: any) {
    console.warn("[CONVERSATION STORE] Redis get failed, using memory fallback:", err?.message);
    const fallback = memoryFallback.get(waId);
    if (fallback) return [...fallback];
  }
  return [];
};

/**
 * Appends a message to the conversation history in Redis.
 * Trims old messages if the history exceeds MAX_MESSAGES_PER_CONVERSATION.
 *
 * @param waId - The WhatsApp ID of the customer
 * @param role - "user" or "model"
 * @param text - The message text
 */
export const addToConversation = async (
  waId: string,
  role: "user" | "model",
  text: string,
): Promise<void> => {
  let history = await getConversationHistory(waId);

  history.push({
    role,
    parts: [{ text }],
  });

  // Trim to keep only the last N messages
  if (history.length > MAX_MESSAGES_PER_CONVERSATION) {
    history = history.slice(-MAX_MESSAGES_PER_CONVERSATION);
  }

  memoryFallback.set(waId, history);

  try {
    await redis.setex(getRedisKey(waId), CONVERSATION_TTL_SECONDS, JSON.stringify(history));
  } catch (err: any) {
    console.warn("[CONVERSATION STORE] Redis setex failed, stored in memory fallback:", err?.message);
  }
};

/**
 * Clears the conversation history for a given customer in Redis.
 * Useful when a customer starts a new session (e.g., sends "hi").
 */
export const clearConversation = async (waId: string): Promise<void> => {
  memoryFallback.delete(waId);
  try {
    await redis.del(getRedisKey(waId));
  } catch (err: any) {
    console.warn("[CONVERSATION STORE] Redis del failed:", err?.message);
  }
};

/**
 * Returns the number of active conversations in the in-memory fallback.
 * Useful for health checks and debug monitoring.
 */
export const getActiveConversationCount = (): number => {
  return memoryFallback.size;
};
