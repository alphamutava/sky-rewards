import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200).trim(),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000).trim(),
  brief: z.string().min(50).max(5000),
  type: z.enum(["VIDEO", "PHOTO", "ARTICLE", "MIXED"]),
  totalBudget: z.number().min(5000),
  startDate: z.string(),
  endDate: z.string(),
  targetCounty: z.string().optional(),
  targetAgeMin: z.number().min(13).max(100).optional(),
  targetAgeMax: z.number().min(13).max(100).optional(),
  targetGender: z.string().optional(),
  tags: z.array(z.string()).max(10).optional().default([]),
  coverImage: z.string().optional(),
  guidelines: z.string().optional(),
  sampleMedia: z.array(z.string()).optional().default([]),
  maxSubmissions: z.number().min(1).max(1000).default(50),
  maxViewsPerSubmission: z.number().min(1).default(10000),
  rewardPerView: z.number().min(0.1).default(0.5),
  creatorReward: z.number().min(100).default(500),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
