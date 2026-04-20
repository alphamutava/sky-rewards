import { z } from "zod";

export const createSubmissionSchema = z.object({
  campaignId: z.string().cuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(["video", "image", "article"]),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().optional(),
  fileSize: z.number().int().optional(),
});

export const updateViewsSchema = z.object({
  viewCount: z.number().int().min(0).max(1000000000),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
