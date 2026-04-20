import { z } from "zod";

export const createSubmissionSchema = z.object({
  campaignId: z.string().cuid(),
  platform: z.enum(["TIKTOK", "INSTAGRAM_REELS", "YOUTUBE_SHORTS", "X_TWITTER"]),
  contentUrl: z.string().url().max(500),
  caption: z.string().max(5000).optional(),
});

export const platformUrlPatterns: Record<string, RegExp> = {
  TIKTOK: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
  INSTAGRAM_REELS: /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[\w-]+/,
  YOUTUBE_SHORTS: /^https?:\/\/(www\.)?(youtube\.com\/shorts\/[\w-]+|youtu\.be\/[\w-]+)/,
  X_TWITTER: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/,
};

export const updateViewsSchema = z.object({
  viewCount: z.number().int().min(0).max(1000000000),
  screenshotUrl: z.string().url().optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
