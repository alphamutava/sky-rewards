import { AuthService } from '@/services/auth.service'
import { loginSchema } from '@/lib/validators'
import { handleApiError } from '@/lib/errors'
import { apiResponse } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = loginSchema.parse(body)
    
    // Login user
    const user = await AuthService.login(validated)
    
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
      message: 'Login successful',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
