import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthenticationError, AuthorizationError, NotFoundError, ValidationError, ConflictError } from "@/lib/api-error";
import { checkRateLimit, submissionLimiter } from "@/lib/rate-limiter";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSubmissionSchema = z.object({
  campaignId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(["video", "image", "article"]),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().optional(),
  fileSize: z.number().int().optional(),
});

// GET /api/submissions — List user's submissions
export const GET = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "12") || 12), 50);
  const status = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaignId");

  const where: Record<string, unknown> = {};

  // Creators see their own, advertisers see submissions on their campaigns
  const role = session.user.role as string;
  if (role === "CREATOR") {
    where.creatorId = session.user.id;
  } else if (["ADVERTISER", "BRAND"].includes(role)) {
    where.campaign = { advertiserId: session.user.id };
  } else if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    throw new AuthorizationError();
  }

  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        campaign: { select: { id: true, title: true, slug: true, rewardPerView: true } },
        creator: { select: { id: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ]);

  return Response.json({
    success: true,
    data: submissions,
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

// POST /api/submissions — Creator submits content
export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CREATOR") throw new AuthorizationError();

  const rateCheck = await checkRateLimit(submissionLimiter, `submit:${session.user.id}`);
  if (!rateCheck.allowed) {
    throw new ValidationError("Too many submissions. Please wait.");
  }

  const body = await req.json();
  const result = createSubmissionSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
  }

  const data = result.data;

  const campaign = await prisma.campaign.findUnique({ where: { id: data.campaignId } });
  if (!campaign) throw new NotFoundError("Campaign");
  if (campaign.status !== "ACTIVE") throw new ValidationError("Campaign is not active");

  // Check if creator already submitted to this campaign (unique constraint)
  const existing = await prisma.submission.findUnique({
    where: { creatorId_campaignId: { creatorId: session.user.id, campaignId: data.campaignId } },
  });
  if (existing) throw new ConflictError("You have already submitted to this campaign");

  // Check campaign submission limits
  if (campaign.totalSubmissions >= campaign.maxSubmissions) {
    throw new ValidationError("Campaign has reached maximum submissions");
  }

  const submission = await prisma.submission.create({
    data: {
      title: data.title,
      description: data.description,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      fileSize: data.fileSize,
      status: "PENDING",
      creatorId: session.user.id,
      campaignId: data.campaignId,
    },
  });

  // Update counters
  await prisma.$transaction([
    prisma.campaign.update({
      where: { id: data.campaignId },
      data: { totalSubmissions: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { totalSubmissions: { increment: 1 } },
    }),
  ]);

  // Notify advertiser
  await createNotification({
    userId: campaign.advertiserId,
    type: "SYSTEM",
    title: "New Submission Received",
    message: `A creator submitted content for "${campaign.title}"`,
  });

  return Response.json({ success: true, data: submission }, { status: 201 });
});
