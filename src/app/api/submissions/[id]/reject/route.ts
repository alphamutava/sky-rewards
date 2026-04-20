import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

export const dynamic = "force-dynamic";

const rejectSchema = z.object({
  reason: z.string().min(5).max(1000),
});

export const PATCH = withErrorHandler(async (req: Request, context) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || !["BRAND", "ADVERTISER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    throw new AuthorizationError();
  }

  const { id } = context!.params;
  const body = await req.json();
  const { reason } = rejectSchema.parse(body);

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { campaign: true },
  });

  if (!submission) throw new NotFoundError("Submission");
  if (["BRAND", "ADVERTISER"].includes(role) && submission.campaign.advertiserId !== session.user.id) {
    throw new AuthorizationError();
  }
  if (!["PENDING", "IN_REVIEW", "FLAGGED"].includes(submission.status)) {
    throw new ValidationError("Submission cannot be rejected in current state");
  }

  await prisma.submission.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
    },
  });

  // Create a review record
  await prisma.review.create({
    data: {
      submissionId: id,
      reviewerId: session.user.id,
      decision: "REJECTED",
      feedback: reason,
    },
  });

  await createNotification({
    userId: submission.creatorId,
    type: "SUBMISSION_REJECTED",
    title: "Submission Rejected",
    message: `Your submission for "${submission.campaign.title}" was rejected: ${reason}`,
  });

  return Response.json({ success: true, message: "Submission rejected" });
});
