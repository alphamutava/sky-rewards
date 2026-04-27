import Redis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on("error", (err) => {
  logger.error("Redis error", { error: err.message });
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});
