import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { SMSService } from '@/lib/sms'
import {
  AppError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/errors'
import { normalizePhone } from '@/lib/validators'
import type { User } from '@prisma/client'

export interface RegisterInput {
  phone: string
  password: string
  firstName: string
  lastName: string
  role: 'VIEWER' | 'CREATOR' | 'ADVERTISER'
  email?: string
  county?: string
}

export interface LoginInput {
  phone: string
  password: string
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<{ user: User; otp: string }> {
    const normalizedPhone = normalizePhone(input.phone)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (existingUser) {
      throw new ConflictError('Phone number already registered')
    }

    // Check if email is taken (if provided)
    if (input.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: input.email },
      })
      if (existingEmail) {
        throw new ConflictError('Email already registered')
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12)

    // Generate OTP
    const otp = SMSService.generateOTP()

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: `${input.firstName} ${input.lastName}`,
        role: input.role,
        status: 'PENDING_VERIFICATION',
        email: input.email,
        county: input.county,
        otpCode: await bcrypt.hash(otp, 10),
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    // Send OTP
    await SMSService.sendOTP(normalizedPhone, otp)

    return { user, otp }
  }

  /**
   * Verify phone OTP
   */
  static async verifyOTP(phone: string, otp: string): Promise<User> {
    const normalizedPhone = normalizePhone(phone)

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new ValidationError('No OTP requested')
    }

    if (new Date() > user.otpExpiresAt) {
      throw new ValidationError('OTP has expired')
    }

    const isValid = await bcrypt.compare(otp, user.otpCode)

    if (!isValid) {
      throw new UnauthorizedError('Invalid OTP')
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        phoneVerified: true,
        status: 'ACTIVE',
      },
    })

    return updatedUser
  }

  /**
   * Login with phone and password
   */
  static async login(input: LoginInput): Promise<User> {
    const normalizedPhone = normalizePhone(input.phone)

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      throw new UnauthorizedError('Invalid credentials')
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      throw new UnauthorizedError('Account is temporarily locked')
    }

    // Check if account is suspended/banned
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}`)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash)

    if (!isValidPassword) {
      // Increment login attempts
      const updatedAttempts = user.loginAttempts + 1
      const lockedUntil = updatedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: updatedAttempts,
          lockedUntil,
        },
      })

      throw new UnauthorizedError('Invalid credentials')
    }

    // Reset login attempts and update last login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    return updatedUser
  }

  /**
   * Resend OTP
   */
  static async resendOTP(phone: string): Promise<{ user: User; otp: string }> {
    const normalizedPhone = normalizePhone(phone)

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    if (user.phoneVerified) {
      throw new ValidationError('Phone already verified')
    }

    // Generate new OTP
    const otp = SMSService.generateOTP()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: await bcrypt.hash(otp, 10),
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    await SMSService.sendOTP(normalizedPhone, otp)

    return { user, otp }
  }

  /**
   * Request password reset
   */
  static async forgotPassword(phone: string): Promise<{ message: string }> {
    const normalizedPhone = normalizePhone(phone)

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the phone number exists, an OTP has been sent' }
    }

    // Generate OTP for password reset
    const otp = SMSService.generateOTP()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: await bcrypt.hash(otp, 10),
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    await SMSService.sendOTP(normalizedPhone, `Your password reset code is: ${otp}`)

    return { message: 'If the phone number exists, an OTP has been sent' }
  }

  /**
   * Reset password
   */
  static async resetPassword(
    phone: string,
    otp: string,
    newPassword: string
  ): Promise<User> {
    const normalizedPhone = normalizePhone(phone)

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedError('Invalid request')
    }

    if (new Date() > user.otpExpiresAt) {
      throw new ValidationError('OTP has expired')
    }

    const isValid = await bcrypt.compare(otp, user.otpCode)

    if (!isValid) {
      throw new UnauthorizedError('Invalid OTP')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otpCode: null,
        otpExpiresAt: null,
      },
    })

    return updatedUser
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    })
  }

  /**
   * Find user by phone number
   */
  static async findByPhone(phone: string): Promise<User | null> {
    const normalizedPhone = normalizePhone(phone)
    return prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })
  }
}
