import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { AdminService } from '@/services/admin.service'
import { PaymentService } from '@/services/payment.service'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'
import { ForbiddenError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/admin/payouts - Get pending payouts
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
      throw new ForbiddenError('Admin access required')
    }

    const payouts = await AdminService.getPendingPayouts()

    return apiResponse({
      payouts: payouts.map((p: { amount: { toNumber: () => number }; createdAt: Date }) => ({
        ...p,
        amount: p.amount.toNumber(),
        createdAt: p.createdAt.toISOString(),
      })),
      count: payouts.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/payouts - Process batch payouts
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
      throw new ForbiddenError('Admin access required')
    }

    const body = await req.json()
    const { transactionIds } = body

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return handleApiError(new Error('No transaction IDs provided'))
    }

    const results = []
    for (const txId of transactionIds) {
      try {
        await PaymentService.processB2CCallback({
          Result: { TransactionID: txId, ResultCode: 0, ResultDesc: 'Success' }
        })
        results.push({ id: txId, status: 'processed' })
      } catch (error) {
        results.push({ id: txId, status: 'failed', error: (error as Error).message })
      }
    }

    return apiResponse({
      message: 'Batch payout processing complete',
      results,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
