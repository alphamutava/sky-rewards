import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Redis } from "@upstash/redis";

const publicPaths = ["/", "/login", "/register", "/about", "/the-100", "/api/auth", "/api/health", "/api/elite", "/api/the-100", "/api/mpesa/callback"];
const authenticatedPaths = ["/dashboard", "/discover", "/submissions", "/earnings", "/wallet", "/badges", "/profile", "/notifications", "/campaigns"];
const advertiserPaths = ["/brand"];
const adminPaths = ["/admin"];

const allowedOrigins = process.env.NODE_ENV === "production" 
  ? ["https://skykenya.co.ke", "https://www.skykenya.co.ke", "https://sky-rewards-seven.vercel.app"] 
  : ["http://localhost:3000"];

// Edge-compatible Redis for rate limiting
const upstashRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const memoryFallbackStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

async function checkRateLimit(identifier: string, maxRequests: number, windowSec: number): Promise<{ allowed: boolean; remaining: number }> {
  if (upstashRedis) {
    try {
      const current = await upstashRedis.incr(identifier);
      if (current === 1) {
        await upstashRedis.expire(identifier, windowSec);
      }
      return { allowed: current <= maxRequests, remaining: Math.max(0, maxRequests - current) };
    } catch (e) {
      console.error("Upstash rate limit error:", e);
    }
  }

  // Memory fallback
  const now = Date.now();
  const record = memoryFallbackStore.get(identifier);
  if (!record || now > record.resetTime) {
    memoryFallbackStore.set(identifier, { count: 1, resetTime: now + windowSec * 1000 });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  // Strict CORS
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse("Forbidden Origin", { status: 403 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-subrequest");
  
  const correlationId = crypto.randomUUID();
  requestHeaders.set("x-correlation-id", correlationId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  
  response.headers.set("X-Correlation-ID", correlationId);

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Public paths - skip auth
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return response;
  }

  // Public GET for campaign listing
  if (pathname === "/api/campaigns" && request.method === "GET") {
    return response;
  }

  // API rate limiting
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const isAuthRoute = pathname.startsWith("/api/auth") || pathname.startsWith("/api/login") || pathname.startsWith("/api/register");
    
    // Stricter limits for auth routes
    const maxRequests = isAuthRoute ? 5 : 100;
    const windowSec = isAuthRoute ? 900 : 60; // 15 min for auth, 1 min for others
    
    const rateLimit = await checkRateLimit(`rl:${ip}:${pathname}`, maxRequests, windowSec);
    
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    
    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
        { status: 429, headers: response.headers }
      );
    }
  }


  // Authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const role = token.role as string;

  // authenticatedPaths just require being logged in (any role)
  // No additional role check needed — token presence is enough
  
  if (advertiserPaths.some((p) => pathname.startsWith(p)) && role !== "ADVERTISER" && role !== "BRAND" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: { code: "FORBIDDEN", message: "Advertiser access required" } }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  
  if (adminPaths.some((p) => pathname.startsWith(p)) && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
