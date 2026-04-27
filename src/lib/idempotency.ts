import { redis } from "./redis";
import { logger } from "./logger";

export async function checkIdempotency<T>(key: string): Promise<T | null> {
  const cached = await redis.get(`idempotency:${key}`);
  if (cached) {
    logger.info(`Idempotency hit for key: ${key}`);
    return JSON.parse(cached) as T;
  }
  return null;
}

export async function saveIdempotency(key: string, data: any, ttlSeconds: number = 86400): Promise<void> {
  await redis.setex(`idempotency:${key}`, ttlSeconds, JSON.stringify(data));
}
