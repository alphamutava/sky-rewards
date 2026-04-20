import { WalletService } from '@/services/wallet.service'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return handleApiError(new Error('Unauthorized'))
    }

    const balance = await WalletService.getBalance(token.sub as string)

    return apiResponse({
      balance: balance.toNumber(),
      currency: 'KES',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
