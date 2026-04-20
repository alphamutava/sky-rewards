import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ViewService } from '@/services/view.service'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/views/earnings - Get viewer's earnings summary
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    const earnings = await ViewService.getEarningsSummary(token.sub)

    return apiResponse({
      today: earnings.today,
      thisWeek: earnings.thisWeek,
      thisMonth: earnings.thisMonth,
      total: earnings.total,
      totalViews: earnings.totalViews,
      dailyCap: earnings.dailyCap,
      dailyCapProgress: earnings.dailyCapProgress,
      currency: 'KES',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
