import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/login", "/register", "/about", "/the-100", "/api/auth", "/api/health", "/api/campaigns", "/api/elite", "/api/the-100", "/api/mpesa/callback", "/api/cron"];
const authenticatedPaths = ["/dashboard", "/discover", "/submissions", "/earnings", "/wallet", "/badges", "/profile", "/notifications", "/campaigns"];
const advertiserPaths = ["/brand"];
const adminPaths = ["/admin"];

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-subrequest");

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

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

  // API rate limiting
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const isAuthRoute = pathname.startsWith("/api/auth") || pathname.startsWith("/api/login") || pathname.startsWith("/api/register");
    
    // Stricter limits for auth routes
    const maxRequests = isAuthRoute ? 5 : 100;
    const windowMs = isAuthRoute ? 15 * 60 * 1000 : 60 * 1000; // 15 min for auth, 1 min for others
    
    const rateLimit = checkRateLimit(`${ip}:${pathname}`, maxRequests, windowMs);
    
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", Math.max(0, rateLimit.remaining).toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(rateLimit.resetTime / 1000).toString());
    
    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
        { status: 429, headers: response.headers }
      );
    }
  }

  // Cron secret check
  if (pathname.startsWith("/api/cron")) {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
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
