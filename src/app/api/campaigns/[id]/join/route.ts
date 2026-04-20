import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";

// In MVP V2, creators don't need to "join" campaigns explicitly.
// They can submit content directly to any active campaign.
// This endpoint now just checks eligibility and returns campaign info.

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (_req: Request, context) => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CREATOR") throw new AuthorizationError();

  const { id } = context!.params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError("Campaign");
  if (campaign.status !== "ACTIVE") throw new ValidationError("Campaign is not active");

  // Check if max submissions reached
  if (campaign.totalSubmissions >= campaign.maxSubmissions) {
    throw new ValidationError("Campaign has reached maximum submissions");
  }

  return Response.json({
    message: "Campaign is available for submissions",
    campaign: {
      id: campaign.id,
      title: campaign.title,
      rewardPerView: campaign.rewardPerView,
      maxSubmissions: campaign.maxSubmissions,
      remainingSubmissions: campaign.maxSubmissions - campaign.totalSubmissions,
    },
  });
});
