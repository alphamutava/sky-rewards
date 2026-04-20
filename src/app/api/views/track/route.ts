import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ViewService } from '@/services/view.service'
import { trackViewSchema } from '@/lib/validators'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/views/track - Track a view and reward viewer
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    // Rate limit: 100 views per hour per user
    const rateLimitResult = await checkRateLimit(`view:${token.sub}`, 100, 3600 * 1000)
    if (!rateLimitResult.success) {
      return handleApiError(new Error('View limit exceeded. Please try again later.'))
    }

    const body = await req.json()
    const validated = trackViewSchema.parse(body)

    // Get client IP and user agent
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Track the view
    const result = await ViewService.trackView({
      submissionId: validated.submissionId,
      viewerId: token.sub,
      watchDuration: validated.watchDuration,
      completionPercent: validated.completionPercent,
      ipAddress: ip,
      userAgent,
    })

    return apiResponse({
      view: result.view,
      earned: result.earned || 0,
      message: result.message,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
