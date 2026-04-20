import { RateLimiterMemory } from "rate-limiter-flexible";

export const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 900,
});

export const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
});

export const depositLimiter = new RateLimiterMemory({
  points: 3,
  duration: 300,
});

export const withdrawalLimiter = new RateLimiterMemory({
  points: 2,
  duration: 3600,
});

export const submissionLimiter = new RateLimiterMemory({
  points: 10,
  duration: 3600,
});

export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  try {
    await limiter.consume(key);
    return { allowed: true };
  } catch (rlResult: unknown) {
    const result = rlResult as { msBeforeNext?: number };
    return {
      allowed: false,
      retryAfterMs: Math.round(result.msBeforeNext || 60000),
    };
  }
}
