import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";
import { updateCampaignSchema } from "@/validators/campaign";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (_req: Request, context) => {
  const { id } = context!.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      advertiser: { select: { id: true, displayName: true, avatar: true, bio: true } },
      _count: { select: { submissions: true } },
    },
  });

  if (!campaign) throw new NotFoundError("Campaign");

  return Response.json({ campaign });
});

export const PUT = withErrorHandler(async (req: Request, context) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || !["BRAND", "ADVERTISER"].includes(role)) throw new AuthorizationError();

  const { id } = context!.params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) throw new NotFoundError("Campaign");
  if (campaign.advertiserId !== session.user.id) throw new AuthorizationError();
  if (!["DRAFT", "PENDING_APPROVAL"].includes(campaign.status)) {
    throw new ValidationError("Can only edit draft or pending approval campaigns");
  }

  const body = await req.json();
  const result = updateCampaignSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      ...result.data,
      startDate: result.data.startDate ? new Date(result.data.startDate) : undefined,
      endDate: result.data.endDate ? new Date(result.data.endDate) : undefined,
      type: result.data.type as any,
    },
  });

  return Response.json({ campaign: updated });
});
