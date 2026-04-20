import { prisma } from "./prisma";
import { EliteService } from "@/services/elite.service";

export async function calculateTrustScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalSubmissions: true,
      totalApproved: true,
      totalViews: true,
      averageRating: true,
      createdAt: true,
    },
  });

  if (!user) return 0;
  if (user.totalSubmissions === 0) return 5;

  // Use the elite score calculation as the trust score basis
  return EliteService.calculateEliteScore(user);
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  // In MVP V2, badges are tracked via the elite system.
  // This is a no-op placeholder that returns empty badges.
  // Elite promotions are handled by EliteService.updateRankings().
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isElite: true, totalApproved: true, totalViews: true, totalEarned: true },
  });

  if (!user) return [];

  const badges: string[] = [];
  if (Number(user.totalEarned) > 0) badges.push("FIRST_EARNING");
  if (user.totalApproved >= 1) badges.push("NEWCOMER");
  if (user.totalApproved >= 10) badges.push("RISING_STAR");
  if (user.totalViews >= 1000000) badges.push("MILLION_VIEWS");
  if (user.isElite) badges.push("ELITE_MEMBER");

  return badges;
}
