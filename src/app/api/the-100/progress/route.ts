import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const members = await prisma.user.findMany({
    where: { isElite: true },
    select: {
      id: true,
      displayName: true,
      avatar: true,
      totalEarned: true,
      totalViews: true,
      eliteRank: true,
      eliteScore: true,
      eliteJoinedAt: true,
    },
    orderBy: { eliteScore: "desc" },
    take: 100,
  });

  const totalEarnings = members.reduce((sum, m) => sum + Number(m.totalEarned), 0);
  const targetKes = 100_000_000; // KES 100M target
  const progressPercent = Math.min((totalEarnings / targetKes) * 100, 100);

  return Response.json({
    success: true,
    data: {
      memberCount: members.length,
      maxMembers: 100,
      totalEarnings,
      targetKes,
      progressPercent: Math.round(progressPercent * 100) / 100,
      members,
    },
  });
});
