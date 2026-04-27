import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, ValidationError } from "@/lib/api-error";
import { slugify } from "@/lib/utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createCampaignSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
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

// GET /api/campaigns — Discover active campaigns (public)
export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "12") || 12), 50);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type");
  const county = url.searchParams.get("county");
  const tag = url.searchParams.get("tag");
  const sort = url.searchParams.get("sort") || "newest";
  const mine = url.searchParams.get("mine");

  const where: Record<string, unknown> = {};

  // If mine=true, show all campaigns by current user (any status)
  if (mine === "true") {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      where.advertiserId = session.user.id;
    } else {
      where.status = "ACTIVE";
    }
  } else {
    where.status = "ACTIVE";
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;
  if (county) where.targetCounty = county;
  if (tag) where.tags = { has: tag };

  const orderBy: Record<string, string> =
    sort === "highest_reward"
      ? { rewardPerView: "desc" }
      : sort === "ending_soon"
        ? { endDate: "asc" }
        : { createdAt: "desc" };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        advertiser: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { submissions: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return Response.json({
    success: true,
    data: campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// POST /api/campaigns — Create campaign (advertiser only)
export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || !["BRAND", "ADVERTISER"].includes(role)) {
    throw new AuthorizationError();
  }

  const body = await req.json();
  const result = createCampaignSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
  }

  const data = result.data;
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (endDate <= startDate) {
    throw new ValidationError("endDate must be after startDate");
  }
  if (endDate <= new Date()) {
    throw new ValidationError("endDate must be in the future");
  }

  const slug = `${slugify(data.title)}-${Date.now().toString(36)}`;
  const platformFeePercent = Number(process.env.PLATFORM_COMMISSION_PERCENT || "15");
  const platformFee = (data.totalBudget * platformFeePercent) / 100;
  const remainingBudget = data.totalBudget - platformFee;

  const campaign = await prisma.campaign.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      brief: data.brief,
      type: data.type,
      status: "DRAFT",
      totalBudget: data.totalBudget,
      remainingBudget,
      platformFee,
      rewardPerView: data.rewardPerView,
      creatorReward: data.creatorReward,
      maxSubmissions: data.maxSubmissions,
      maxViewsPerSubmission: data.maxViewsPerSubmission,
      targetCounty: data.targetCounty || null,
      targetAgeMin: data.targetAgeMin || null,
      targetAgeMax: data.targetAgeMax || null,
      targetGender: data.targetGender || null,
      tags: data.tags,
      coverImage: data.coverImage || null,
      guidelines: data.guidelines || null,
      sampleMedia: data.sampleMedia,
      startDate,
      endDate,
      advertiserId: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "campaign.create",
      entity: "campaign",
      entityId: campaign.id,
      newValue: { title: campaign.title, totalBudget: data.totalBudget },
    },
  });

  return Response.json({ success: true, data: campaign }, { status: 201 });
});
