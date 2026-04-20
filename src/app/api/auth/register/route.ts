import { AuthService } from '@/services/auth.service'
import { registerSchema } from '@/lib/validators'
import { apiResponse } from '@/lib/utils'
import { handleApiError, ConflictError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = await checkRateLimit(`register:${ip}`, 5, 300) // 5 per 5 min
    if (!rateLimitResult.success) {
      return handleApiError(new Error('Too many registration attempts. Please try again later.'))
    }

    const body = await req.json()
    const validated = registerSchema.parse(body)

    // Check for existing user
    const existingUser = await AuthService.findByPhone(validated.phone)
    if (existingUser) {
      throw new ConflictError('An account with this phone number already exists')
    }

    // Register user
    const result = await AuthService.register(validated)

    return apiResponse(
      {
        userId: result.user.id,
        phone: result.user.phone,
        message: 'Account created successfully. Please verify your phone number with the OTP sent via SMS.',
      },
      'Registration successful',
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
