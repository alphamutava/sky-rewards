import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { generateReference } from "@/lib/utils";

export const dynamic = "force-dynamic";

function validateCronSecret(request: Request): boolean {
  return request.headers.get("x-cron-secret") === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  if (!validateCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commissionRate = parseFloat(process.env.PLATFORM_COMMISSION_RATE || "0.15");

  // Find approved submissions with views that haven't been paid yet
  const submissions = await prisma.submission.findMany({
    where: {
      status: "APPROVED",
      viewCount: { gt: 0 },
      totalEarned: { equals: 0 },
    },
    include: {
      campaign: true,
    },
  });

  let processed = 0;

  for (const sub of submissions) {
    const views = sub.viewCount;
    if (views <= 0) continue;

    const rewardPerView = Number(sub.campaign.rewardPerView);
    const grossEarning = views * rewardPerView;

    // Check campaign has remaining budget
    const remainingBudget = Number(sub.campaign.remainingBudget);
    if (grossEarning > remainingBudget) continue;

    const commission = Math.round(grossEarning * commissionRate * 100) / 100;
    const netEarning = grossEarning - commission;

    try {
      await prisma.$transaction(async (tx) => {
        // Update submission earnings
        await tx.submission.update({
          where: { id: sub.id },
          data: {
            totalEarned: netEarning,
          },
        });

        // Deduct from campaign budget
        await tx.campaign.update({
          where: { id: sub.campaignId },
          data: {
            totalSpent: { increment: grossEarning },
            remainingBudget: { decrement: grossEarning },
          },
        });

        // Credit creator wallet
        await tx.user.update({
          where: { id: sub.creatorId },
          data: {
            walletBalance: { increment: netEarning },
            totalEarned: { increment: netEarning },
          },
        });

        // Create earning transaction
        await tx.transaction.create({
          data: {
            referenceCode: generateReference(),
            type: "CREATOR_PAYOUT",
            status: "COMPLETED",
            method: "WALLET",
            amount: grossEarning,
            fee: commission,
            netAmount: netEarning,
            userId: sub.creatorId,
            campaignId: sub.campaignId,
            transactionDesc: `Earnings for "${sub.campaign.title}" (${views.toLocaleString()} views)`,
            completedAt: new Date(),
          },
        });
      });

      await createNotification({
        userId: sub.creatorId,
        type: "PAYMENT_RECEIVED",
        title: "Earnings Credited!",
        message: `KES ${netEarning.toLocaleString()} earned from "${sub.campaign.title}"`,
      });

      processed++;
    } catch (error) {
      console.error(`[Cron] Failed to process submission ${sub.id}:`, error);
    }
  }

  return Response.json({ message: `Processed ${processed} submissions` });
}
