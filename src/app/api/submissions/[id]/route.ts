import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthenticationError, NotFoundError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (_req: Request, context) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  const { id } = context!.params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, title: true, slug: true, rewardPerView: true, creatorReward: true } },
      creator: { select: { id: true, displayName: true, avatar: true } },
      reviews: true,
    },
  });

  if (!submission) throw new NotFoundError("Submission");

  return Response.json({ success: true, data: submission });
});
