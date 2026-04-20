import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";
import { generateReference } from "@/lib/utils";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["PAUSED", "ACTIVE", "COMPLETED", "CANCELLED"]),
});

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandler(async (req: Request, context) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || !['BRAND', 'ADVERTISER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new AuthorizationError();
  }

  const { id } = context!.params;
  const body = await req.json();
  const { status: newStatus } = statusSchema.parse(body);

  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) throw new NotFoundError("Campaign");

  if (['BRAND', 'ADVERTISER'].includes(role) && campaign.advertiserId !== session.user.id) {
    throw new AuthorizationError();
  }

  const validTransitions: Record<string, string[]> = {
    ACTIVE: ["PAUSED", "COMPLETED", "CANCELLED"],
    PAUSED: ["ACTIVE", "CANCELLED"],
    DRAFT: ["CANCELLED"],
  };

  if (!validTransitions[campaign.status]?.includes(newStatus)) {
    throw new ValidationError(`Cannot transition from ${campaign.status} to ${newStatus}`);
  }

  // Refund remaining budget if completing or cancelling
  if ((newStatus === "COMPLETED" || newStatus === "CANCELLED") && campaign.remainingBudget.toNumber() > 0) {
    const user = await prisma.user.findUnique({ where: { id: campaign.advertiserId } });
    if (user) {
      await prisma.$transaction(async (tx) => {
        // Refund to user's wallet
        await tx.user.update({
          where: { id: campaign.advertiserId },
          data: {
            walletBalance: { increment: campaign.remainingBudget },
          },
        });

        // Create refund transaction
        await tx.transaction.create({
          data: {
            referenceCode: generateReference(),
            type: "ADJUSTMENT",
            status: "COMPLETED",
            method: "WALLET",
            amount: campaign.remainingBudget,
            fee: 0,
            netAmount: campaign.remainingBudget,
            userId: campaign.advertiserId,
            campaignId: campaign.id,
            transactionDesc: `Refund for campaign: ${campaign.title}`,
            completedAt: new Date(),
          },
        });

        // Update campaign status and zero out remaining budget
        await tx.campaign.update({
          where: { id },
          data: { status: newStatus, remainingBudget: 0 },
        });
      });

      return Response.json({ message: `Campaign ${newStatus.toLowerCase()}. KES ${campaign.remainingBudget.toNumber().toLocaleString()} refunded.` });
    }
  }

  await prisma.campaign.update({ where: { id }, data: { status: newStatus } });

  return Response.json({ message: `Campaign status updated to ${newStatus}` });
});
