import { z } from "zod";

// MVP V2: flat User model — single profile schema for all roles
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).trim().optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  county: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
});

// Backward-compat aliases (both point to flat User fields)
export const updateCreatorProfileSchema = updateProfileSchema;
export const updateBrandProfileSchema = updateProfileSchema;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateCreatorProfileInput = UpdateProfileInput;
export type UpdateBrandProfileInput = UpdateProfileInput;
