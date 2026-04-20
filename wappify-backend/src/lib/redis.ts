import Redis from "ioredis";

// Centralised Redis Client configuration
// In production, REDIS_URL should point to your Upstash or Elasticache instance.

const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[REDIS WARNING] REDIS_URL is not set. Falling back to localhost.");
  }
  return new Redis(redisUrl || "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
};

export const redis = getRedisClient();

// Connect explicitly (non-blocking) and handle errors
redis.connect().catch((err) => {
  console.warn("[REDIS ERROR] Failed to connect to Redis. Will retry on next command:", err?.message);
});

redis.on("error", (err) => {
  console.warn("[REDIS ERROR]", err?.message);
});

redis.on("ready", () => {
  console.log("⚡ Redis client connected successfully");
});
