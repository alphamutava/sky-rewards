import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { EliteService } from '@/services/elite.service'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/elite - Get current Elite 100 members
export async function GET(req: NextRequest) {
  try {
    const elite = await EliteService.getElite100()

    return apiResponse({
      elite: elite.map((e: { id: string; displayName: string | null; isElite: boolean; eliteRank: number | null; eliteScore: { toNumber: () => number }; totalEarned: { toNumber: () => number }; totalApproved: number; averageRating: { toNumber: () => number } }) => ({
        id: e.id,
        displayName: e.displayName,
        isElite: e.isElite,
        eliteRank: e.eliteRank,
        eliteScore: e.eliteScore.toNumber(),
        totalEarned: e.totalEarned.toNumber(),
        totalApproved: e.totalApproved,
        averageRating: e.averageRating.toNumber(),
      })),
      total: elite.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/elite - Apply for Elite consideration (creators only)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    // Check if user is a creator
    if (token.role !== 'CREATOR') {
      return handleApiError(new Error('Only creators can apply for Elite status'))
    }

    const result = await EliteService.applyForElite(token.sub)

    return apiResponse({
      message: 'Application submitted successfully',
      currentScore: result.score.toNumber(),
      qualified: result.qualified,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
