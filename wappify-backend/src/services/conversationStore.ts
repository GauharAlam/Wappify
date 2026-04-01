import { Content } from "@google/generative-ai";

// ─────────────────────────────────────────────
// In-memory conversation store
// Keyed by WhatsApp ID → array of Gemini Content.
// Each entry also tracks the last activity timestamp
// so we can prune stale conversations automatically.
// ─────────────────────────────────────────────

const MAX_MESSAGES_PER_CONVERSATION = 10;
const CONVERSATION_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // Run cleanup every 10 minutes

interface ConversationEntry {
  history: Content[];
  lastActivityAt: number;
}

const store = new Map<string, ConversationEntry>();

// ─────────────────────────────────────────────
// Auto-cleanup — prune entries older than TTL
// ─────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  let pruned = 0;

  for (const [waId, entry] of store.entries()) {
    if (now - entry.lastActivityAt > CONVERSATION_TTL_MS) {
      store.delete(waId);
      pruned++;
    }
  }

  if (pruned > 0) {
    console.log(
      `[CONVERSATION STORE] 🧹 Pruned ${pruned} stale conversation(s). Active: ${store.size}`,
    );
  }
}, CLEANUP_INTERVAL_MS);

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Returns the conversation history for a given WhatsApp ID.
 * Returns an empty array if no history exists.
 */
export const getConversationHistory = (waId: string): Content[] => {
  const entry = store.get(waId);
  return entry ? [...entry.history] : [];
};

/**
 * Appends a message to the conversation history.
 * Trims old messages if the history exceeds MAX_MESSAGES_PER_CONVERSATION.
 *
 * @param waId - The WhatsApp ID of the customer
 * @param role - "user" or "model"
 * @param text - The message text
 */
export const addToConversation = (
  waId: string,
  role: "user" | "model",
  text: string,
): void => {
  let entry = store.get(waId);

  if (!entry) {
    entry = { history: [], lastActivityAt: Date.now() };
    store.set(waId, entry);
  }

  entry.history.push({
    role,
    parts: [{ text }],
  });

  entry.lastActivityAt = Date.now();

  // Trim to keep only the last N messages
  if (entry.history.length > MAX_MESSAGES_PER_CONVERSATION) {
    entry.history = entry.history.slice(-MAX_MESSAGES_PER_CONVERSATION);
  }
};

/**
 * Clears the conversation history for a given customer.
 * Useful when a customer starts a new session (e.g., sends "hi").
 */
export const clearConversation = (waId: string): void => {
  store.delete(waId);
};

/**
 * Returns the number of active conversations in the store.
 * Useful for logging/monitoring.
 */
export const getActiveConversationCount = (): number => {
  return store.size;
};
