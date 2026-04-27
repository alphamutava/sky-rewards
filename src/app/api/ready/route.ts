import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    // 1. Check DB
    await prisma.$queryRaw`SELECT 1`;
    
    // 2. Check Redis
    const redisStatus = await redis.ping();
    if (redisStatus !== "PONG") {
      throw new Error("Redis did not respond with PONG");
    }

    return NextResponse.json({
      status: "ready",
      components: {
        database: "ok",
        redis: "ok",
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "not_ready",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
