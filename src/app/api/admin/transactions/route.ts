import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { AdminService } from '@/services/admin.service'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'
import { ForbiddenError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/admin/transactions - Get all transactions
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
      throw new ForbiddenError('Admin access required')
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status') || undefined
    const type = url.searchParams.get('type') || undefined

    const result = await AdminService.getTransactions({ page, limit, status, type })

    return apiResponse({
      transactions: result.transactions.map((t: { amount: { toNumber: () => number }; fee: { toNumber: () => number }; netAmount: { toNumber: () => number }; createdAt: Date; completedAt: Date | null }) => ({
        ...t,
        amount: t.amount.toNumber(),
        fee: t.fee.toNumber(),
        netAmount: t.netAmount.toNumber(),
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
