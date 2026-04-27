import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (_req: Request, context) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  const { id } = context!.params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, title: true, slug: true, rewardPerView: true, creatorReward: true, advertiserId: true } },
      creator: { select: { id: true, displayName: true, avatar: true } },
      reviews: true,
    },
  });

  if (!submission) throw new NotFoundError("Submission");

  // Authorization: creators see only their own, advertisers see only their campaigns
  const role = session.user.role as string;
  if (role === "CREATOR" && submission.creatorId !== session.user.id) {
    throw new AuthorizationError();
  }
  if (["ADVERTISER"].includes(role) && submission.campaign.advertiserId !== session.user.id) {
    throw new AuthorizationError();
  }
  // ADMIN/SUPER_ADMIN can see all

  return Response.json({ success: true, data: submission });
});
