import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const envCheck = {
    MPESA_CONSUMER_KEY: !!process.env.MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET: !!process.env.MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
    MPESA_PASSKEY: !!process.env.MPESA_PASSKEY,
    MPESA_CALLBACK_BASE_URL: process.env.MPESA_CALLBACK_BASE_URL,
    MPESA_ENVIRONMENT: process.env.MPESA_ENVIRONMENT,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  };

  const missing = Object.entries(envCheck)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  return NextResponse.json({
    status: missing.length === 0 ? "OK" : "MISSING_VARS",
    missing,
    envCheck,
  });
}
