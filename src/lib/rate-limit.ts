import { Redis } from 'ioredis'

// Redis client configuration
const redisUrl = process.env.REDIS_URL

let redis: Redis | null = null

if (redisUrl) {
  redis = new Redis(redisUrl)
} else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Use Upstash Redis REST API
  redis = null // Will implement REST fallback below
}

// Rate limit configuration
const DEFAULT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const DEFAULT_MAX_REQUESTS = 100

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Rate limit by identifier (IP, userId, etc.)
 */
export async function rateLimit(
  identifier: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - windowMs

  // If Redis is available, use it
  if (redis) {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart)
    
    // Count current entries in window
    const count = await redis.zcard(key)
    
    if (count >= maxRequests) {
      // Get the oldest entry to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES')
      const resetTime = parseInt(oldest[1]) + windowMs
      
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetTime,
      }
    }
    
    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`)
    await redis.pexpire(key, windowMs)
    
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - count - 1,
      resetTime: now + windowMs,
    }
  }
  
  // Fallback: In-memory rate limiting (per-instance only)
  return inMemoryRateLimit(identifier, maxRequests, windowMs)
}

// In-memory store for fallback
const memoryStore: Map<string, number[]> = new Map()

function inMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Get existing timestamps
  let timestamps = memoryStore.get(identifier) || []
  
  // Filter to only include requests in current window
  timestamps = timestamps.filter((ts) => ts > windowStart)
  
  if (timestamps.length >= maxRequests) {
    const resetTime = timestamps[0] + windowMs
    
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime,
    }
  }
  
  // Add current request
  timestamps.push(now)
  memoryStore.set(identifier, timestamps)
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    cleanupMemoryStore()
  }
  
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - timestamps.length,
    resetTime: now + windowMs,
  }
}

function cleanupMemoryStore() {
  const now = Date.now()
  const maxWindowMs = 60 * 60 * 1000 // 1 hour max window
  
  for (const [key, timestamps] of Array.from(memoryStore.entries())) {
    const filtered = timestamps.filter((ts: number) => now - ts < maxWindowMs)
    if (filtered.length === 0) {
      memoryStore.delete(key)
    } else {
      memoryStore.set(key, filtered)
    }
  }
}

/**
 * Alias for rateLimit (backward compatibility)
 */
export { rateLimit as checkRateLimit }

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  // Check for forwarded IP (behind proxy/CDN)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback - in production this would come from the connection
  return 'unknown'
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  }
}
