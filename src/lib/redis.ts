import Redis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";

// Redis is optional - deployment won't hang if REDIS_URL is not set
export const redis = config.REDIS_URL
  ? new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 50, 500),
      connectTimeout: 5000,
    })
  : null;

if (redis) {
  redis.on("error", (err) => {
    logger.error("Redis error", { error: err.message });
  });

  redis.on("connect", () => {
    logger.info("Connected to Redis");
  });
}
