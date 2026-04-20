import { EliteService } from '@/services/elite.service'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/elite/leaderboard - Get full leaderboard with scores
export async function GET() {
  try {
    const leaderboard = await EliteService.getLeaderboard()

    return apiResponse({
      leaderboard: leaderboard.map((user: { id: string; displayName: string | null; eliteScore: { toNumber: () => number }; totalApproved: number; totalViews: number; averageRating: { toNumber: () => number }; isElite: boolean; eliteRank: number | null }) => ({
        id: user.id,
        displayName: user.displayName,
        eliteScore: user.eliteScore.toNumber(),
        totalApproved: user.totalApproved,
        totalViews: user.totalViews,
        averageRating: user.averageRating.toNumber(),
        isElite: user.isElite,
        eliteRank: user.eliteRank,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
