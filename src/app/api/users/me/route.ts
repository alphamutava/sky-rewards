import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/users/me - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        bio: true,
        role: true,
        status: true,
        county: true,
        city: true,
        phoneVerified: true,
        walletBalance: true,
        totalEarned: true,
        totalWithdrawn: true,
        isElite: true,
        eliteRank: true,
        eliteScore: true,
        totalViews: true,
        totalSubmissions: true,
        totalApproved: true,
        averageRating: true,
        createdAt: true,
      },
    })

    if (!user) {
      return handleApiError(new Error('User not found'))
    }

    return apiResponse({ user })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/users/me - Update current user profile
export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    const body = await req.json()
    const { firstName, lastName, displayName, bio, email, county, city, avatar } = body

    const user = await prisma.user.update({
      where: { id: token.sub },
      data: {
        firstName,
        lastName,
        displayName,
        bio,
        email,
        county,
        city,
        avatar,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        bio: true,
        role: true,
        county: true,
        city: true,
        updatedAt: true,
      },
    })

    return apiResponse({ user, message: 'Profile updated successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
