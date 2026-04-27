import Redis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";

// Redis is optional - completely disabled if DISABLE_REDIS=true or no REDIS_URL
export const redis =
  !config.DISABLE_REDIS && config.REDIS_URL
    ? new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 50, 500),
        connectTimeout: 5000,
        enableOfflineQueue: false,
        enableReadyCheck: false,
      })
    : null;

if (redis) {
  redis.on("error", (err) => {
    // Silently ignore Redis errors in production to prevent log spam
    if (config.NODE_ENV === "development") {
      logger.error("Redis error", { error: err.message });
    }
  });

  redis.on("connect", () => {
    logger.info("Connected to Redis");
  });
}
