import { z } from "zod";

export const updateCreatorProfileSchema = z.object({
  displayName: z.string().min(2).max(100).trim(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
  phoneNumber: z.string().regex(/^254\d{9}$/),
  county: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  tiktokUsername: z.string().max(100).optional(),
  instagramUsername: z.string().max(100).optional(),
  youtubeChannel: z.string().max(200).optional(),
  xUsername: z.string().max(100).optional(),
  niches: z.array(z.string().max(50)).max(5).default([]),
});

export const updateBrandProfileSchema = z.object({
  companyName: z.string().min(2).max(200).trim(),
  description: z.string().max(5000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^254\d{9}$/),
  contactPersonName: z.string().max(200).optional(),
  contactPersonEmail: z.string().email().optional(),
  county: z.string().max(100).optional(),
  physicalAddress: z.string().max(500).optional(),
});

export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
export type UpdateBrandProfileInput = z.infer<typeof updateBrandProfileSchema>;
