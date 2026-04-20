import { EliteService } from '@/services/elite.service'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/elite/leaderboard - Get full leaderboard with scores
export async function GET() {
  try {
    const result = await EliteService.getLeaderboard()

    return apiResponse({
      leaderboard: result.creators.map((user: any) => ({
        id: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        eliteScore: Number(user.eliteScore),
        totalApproved: user.totalApproved,
        totalSubmissions: user.totalSubmissions,
        totalViews: user.totalViews,
        averageRating: Number(user.averageRating),
        isElite: user.isElite,
        eliteRank: user.eliteRank,
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
