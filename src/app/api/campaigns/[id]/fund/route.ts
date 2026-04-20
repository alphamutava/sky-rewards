import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ConflictError } from "@/lib/api-error";
import { generateReference } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (_req: Request, context) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || role !== 'ADVERTISER') throw new AuthorizationError();

  const { id } = context!.params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign) throw new NotFoundError("Campaign");
  if (campaign.advertiserId !== session.user.id) throw new AuthorizationError();
  if (campaign.status !== "DRAFT") throw new ConflictError("Campaign is already funded");

  // Get user with wallet balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true },
  });
  if (!user) throw new NotFoundError("User");

  // Check if user has sufficient balance
  const budget = campaign.totalBudget.toNumber();
  const balance = user.walletBalance.toNumber();
  if (balance < budget) {
    throw new Error("Insufficient wallet balance. Please deposit funds first.");
  }

  await prisma.$transaction(async (tx) => {
    // Deduct from user wallet
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        walletBalance: { decrement: campaign.totalBudget },
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        referenceCode: generateReference(),
        type: "CAMPAIGN_FUND",
        status: "COMPLETED",
        method: "WALLET",
        amount: campaign.totalBudget,
        fee: 0,
        netAmount: campaign.totalBudget,
        userId: session.user.id,
        campaignId: campaign.id,
        transactionDesc: `Funded campaign: ${campaign.title}`,
        completedAt: new Date(),
      },
    });

    // Activate campaign
    await tx.campaign.update({
      where: { id: campaign.id },
      data: { status: "ACTIVE" },
    });
  });

  return Response.json({ message: "Campaign funded and activated" });
});
