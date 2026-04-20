import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateViewsSchema = z.object({
  viewCount: z.number().int().min(0),
});

export const POST = withErrorHandler(async (req: Request, context) => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CREATOR") throw new AuthorizationError();

  const { id } = context!.params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { campaign: true },
  });

  if (!submission) throw new NotFoundError("Submission");
  if (submission.creatorId !== session.user.id) throw new AuthorizationError();
  if (submission.status !== "APPROVED") throw new ValidationError("Only approved submissions can track views");

  const body = await req.json();
  const { viewCount } = updateViewsSchema.parse(body);

  if (viewCount < submission.viewCount) {
    throw new ValidationError("View count cannot decrease");
  }

  const newViews = viewCount - submission.viewCount;
  const rewardPerView = Number(submission.campaign.rewardPerView);
  const additionalEarnings = newViews * rewardPerView;

  await prisma.submission.update({
    where: { id },
    data: {
      viewCount,
      totalEarned: { increment: additionalEarnings },
    },
  });

  // Update campaign total views
  await prisma.campaign.update({
    where: { id: submission.campaignId },
    data: { totalViews: { increment: newViews } },
  });

  return Response.json({
    success: true,
    data: {
      viewCount,
      newViews,
      additionalEarnings,
    },
  });
});
