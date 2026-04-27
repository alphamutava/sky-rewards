import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  
  MPESA_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_CALLBACK_BASE_URL: z.string().url().optional(),
  MPESA_CALLBACK_SECRET: z.string().optional(),
  
  MPESA_B2C_SHORTCODE: z.string().optional(),
  MPESA_B2C_INITIATOR_NAME: z.string().optional(),
  MPESA_B2C_SECURITY_CREDENTIAL: z.string().optional(),
  MPESA_ALLOWED_IPS: z.string().optional(),
  
  AT_USERNAME: z.string().optional().default("sandbox"),
  AT_API_KEY: z.string().optional(),
  AT_SENDER_ID: z.string().optional(),
  
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default("noreply@skykenya.co.ke"),
  
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  PLATFORM_COMMISSION_PERCENT: z.string().default("15"),
  MIN_WITHDRAWAL_KES: z.string().default("100"),
  MAX_WITHDRAWAL_KES: z.string().default("150000"),
  MAX_DAILY_VIEW_EARNINGS_KES: z.string().default("500"),
  ELITE_BONUS_MULTIPLIER: z.string().default("1.5"),
  
  CRON_SECRET: z.string().optional()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const config = _env.data;
