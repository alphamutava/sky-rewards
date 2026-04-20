import { AuthService } from '@/services/auth.service'
import { verifyOtpSchema } from '@/lib/validators'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = verifyOtpSchema.parse(body)
    
    // Verify OTP
    const user = await AuthService.verifyOTP(validated.phone, validated.otp)
    
    return apiResponse({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        phoneVerified: user.phoneVerified,
      },
      message: 'Phone verified successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
