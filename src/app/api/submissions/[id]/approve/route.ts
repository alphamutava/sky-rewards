import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandler(async (_req: Request, context) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || !["BRAND", "ADVERTISER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    throw new AuthorizationError();
  }

  const { id } = context!.params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { campaign: true },
  });

  if (!submission) throw new NotFoundError("Submission");

  // Advertiser can only approve their own campaign submissions
  if (["BRAND", "ADVERTISER"].includes(role) && submission.campaign.advertiserId !== session.user.id) {
    throw new AuthorizationError();
  }

  if (!["PENDING", "IN_REVIEW", "FLAGGED"].includes(submission.status)) {
    throw new ValidationError("Submission cannot be approved in current state");
  }

  await prisma.$transaction([
    prisma.submission.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
    prisma.campaign.update({
      where: { id: submission.campaignId },
      data: { approvedSubmissions: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: submission.creatorId },
      data: { totalApproved: { increment: 1 } },
    }),
  ]);

  // Create a review record
  await prisma.review.create({
    data: {
      submissionId: id,
      reviewerId: session.user.id,
      decision: "APPROVED",
      feedback: "Submission approved",
    },
  });

  await createNotification({
    userId: submission.creatorId,
    type: "SUBMISSION_APPROVED",
    title: "Submission Approved!",
    message: `Your submission for "${submission.campaign.title}" has been approved. Views are now being tracked.`,
  });

  return Response.json({ success: true, message: "Submission approved" });
});
