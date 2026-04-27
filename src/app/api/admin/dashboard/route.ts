import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(role)) throw new AuthorizationError();

  const [
    totalUsers,
    totalCreators,
    totalAdvertisers,
    activeCampaigns,
    totalSubmissions,
    totalRevenue,
    totalPayouts,
    platformCommission,
    recentSignups,
    eliteMembers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CREATOR" } }),
    prisma.user.count({ where: { role: "ADVERTISER" } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.submission.count(),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "PLATFORM_COMMISSION", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.user.count({ where: { isElite: true } }),
  ]);

  return Response.json({
    overview: {
      totalUsers,
      totalCreators,
      totalAdvertisers,
      activeCampaigns,
      totalSubmissions,
      recentSignups,
      eliteMembers,
    },
    financial: {
      totalDeposits: totalRevenue._sum.amount?.toNumber() || 0,
      totalPayouts: totalPayouts._sum.amount?.toNumber() || 0,
      platformCommission: platformCommission._sum.amount?.toNumber() || 0,
    },
  });
});
