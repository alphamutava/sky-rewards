import { z } from 'zod'

// Kenyan phone validation (07XX or 01XX numbers, with or without country code)
export const phoneSchema = z.string()
  .transform(v => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(
    /^(?:\+?254|0)?[17]\d{8}$/,
    'Invalid Kenyan phone number. Use format 07XXXXXXXX'
  ))

// Normalize phone to 254XXXXXXXXX
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '')
  
  if (cleaned.startsWith('+254')) {
    return cleaned.substring(1)
  }
  
  if (cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1)
  }
  
  if (!cleaned.startsWith('254')) {
    return '254' + cleaned
  }
  
  return cleaned
}

// Registration schema
export const registerSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(8).max(100),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: z.enum(['VIEWER', 'CREATOR', 'ADVERTISER']),
  email: z.string().email().optional(),
  county: z.string().optional(),
})

// OTP verification schema
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
})

// Login schema
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
})

// Campaign creation schema
export const createCampaignSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  brief: z.string().min(50).max(5000),
  type: z.enum(['VIDEO', 'PHOTO', 'ARTICLE', 'MIXED']),
  totalBudget: z.number().min(5000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targetCounty: z.string().optional(),
  targetAgeMin: z.number().min(13).max(100).optional(),
  targetAgeMax: z.number().min(13).max(100).optional(),
  targetGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  maxSubmissions: z.number().min(1).max(1000).default(50),
  rewardPerView: z.number().min(0.10).max(10).default(0.50),
  creatorReward: z.number().min(100).optional(),
  maxViewsPerSubmission: z.number().min(100).max(100000).default(10000),
})

// Submission creation schema
export const createSubmissionSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(['video', 'photo', 'article']),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().min(1).optional(),
  fileSize: z.number().int().optional(),
})

// Review schema
export const reviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
  qualityScore: z.number().min(0).max(5).optional(),
  feedback: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
})

// View tracking schema
export const trackViewSchema = z.object({
  submissionId: z.string().cuid(),
  watchDuration: z.number().int().min(0),
  completionPercent: z.number().min(0).max(100),
})

// Withdrawal schema
export const withdrawalSchema = z.object({
  amount: z.number().min(100).max(150000),
  phone: phoneSchema,
})

// STK Push schema
export const stkPushSchema = z.object({
  amount: z.number().min(1000).max(1000000),
  phone: phoneSchema,
  accountReference: z.string().min(1).max(20).optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().int().min(1).default(1)),
  limit: z.string().optional().transform(Number).pipe(z.number().int().min(1).max(100).default(20)),
})

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
})

// Password reset schema
export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
})

export const resetPasswordSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(100),
})

// System settings schema (admin only)
export const systemSettingsSchema = z.object({
  commissionRate: z.number().min(0).max(50).optional(),
  minimumWithdrawalKes: z.number().min(50).optional(),
  maximumWithdrawalKes: z.number().min(100).optional(),
  dailyWithdrawalLimitKes: z.number().min(1000).optional(),
  minimumDepositKes: z.number().min(100).optional(),
  viewRewardKes: z.number().min(0.10).max(10).optional(),
  eliteBonusMultiplier: z.number().min(1).max(5).optional(),
  maxDailyViewEarningsKes: z.number().min(100).max(10000).optional(),
})

// Types
export type RegisterInput = z.infer<typeof registerSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type TrackViewInput = z.infer<typeof trackViewSchema>
export type WithdrawalInput = z.infer<typeof withdrawalSchema>
export type StkPushInput = z.infer<typeof stkPushSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>
