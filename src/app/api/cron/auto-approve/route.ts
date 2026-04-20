import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function validateCronSecret(request: Request): boolean {
  return request.headers.get("x-cron-secret") === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  if (!validateCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-approve PENDING submissions older than 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const submissions = await prisma.submission.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: cutoff },
    },
    include: { campaign: true },
  });

  let approved = 0;
  for (const sub of submissions) {
    try {
      await prisma.$transaction([
        prisma.submission.update({
          where: { id: sub.id },
          data: { status: "APPROVED" },
        }),
        prisma.campaign.update({
          where: { id: sub.campaignId },
          data: { approvedSubmissions: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: sub.creatorId },
          data: { totalApproved: { increment: 1 } },
        }),
      ]);

      await createNotification({
        userId: sub.creatorId,
        type: "SUBMISSION_APPROVED",
        title: "Submission Auto-Approved",
        message: `Your submission for "${sub.campaign.title}" was automatically approved.`,
      });

      approved++;
    } catch (err) {
      console.error(`[Cron] Failed to auto-approve ${sub.id}:`, err);
    }
  }

  return Response.json({ message: `Auto-approved ${approved} submissions` });
}
