import { prisma } from '@/lib/prisma'
import { handleApiError, ConflictError, ValidationError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const emailRegisterSchema = z.object({
  email: z.string().email('Invalid email address').max(255).transform(v => v.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['CREATOR', 'BRAND', 'ADVERTISER', 'VIEWER']),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = await checkRateLimit(`register:${ip}`, 5, 300000) // 5 per 5 min
    if (!rateLimitResult.success) {
      throw new ValidationError('Too many registration attempts. Please try again later.')
    }

    const body = await req.json()
    const validated = emailRegisterSchema.parse(body)

    // Check for existing user by email
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })
    if (existingUser) {
      throw new ConflictError('An account with this email already exists')
    }

    // Map BRAND role to ADVERTISER (schema uses ADVERTISER)
    const role = validated.role === 'BRAND' ? 'ADVERTISER' : validated.role

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        role,
        status: 'ACTIVE',
        displayName: validated.email.split('@')[0],
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          message: 'Account created successfully. Please sign in.',
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
