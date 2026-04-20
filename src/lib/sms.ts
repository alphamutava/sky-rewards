import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Africa's Talking configuration
const AT_USERNAME = process.env.AT_USERNAME || 'sandbox'
const AT_API_KEY = process.env.AT_API_KEY || ''
const AT_SENDER_ID = process.env.AT_SENDER_ID || 'SKYKENYA'

export class SMSService {
  /**
   * Generate a 6-digit OTP
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Send OTP via SMS
   */
  static async sendOTP(phone: string, otp: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone)
    const message = `Your Sky Kenya verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`

    try {
      // In production, use Africa's Talking API
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': AT_API_KEY,
          },
          body: new URLSearchParams({
            username: AT_USERNAME,
            to: normalizedPhone,
            message: message,
            from: AT_SENDER_ID,
          }),
        })

        if (!response.ok) {
          console.error('SMS sending failed:', await response.text())
          return false
        }

        return true
      }

      // Development mode: log to console
      console.log(`[DEV SMS] To: ${normalizedPhone}, Message: ${message}`)
      return true
    } catch (error) {
      console.error('SMS service error:', error)
      return false
    }
  }

  /**
   * Store OTP in database (hashed)
   */
  static async storeOTP(userId: string, otp: string): Promise<void> {
    const hashedOTP = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await prisma.user.update({
      where: { id: userId },
      data: {
        otpCode: hashedOTP,
        otpExpiresAt: expiresAt,
      },
    })
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(userId: string, otp: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { otpCode: true, otpExpiresAt: true },
    })

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return false
    }

    // Check expiry
    if (new Date() > user.otpExpiresAt) {
      return false
    }

    // Verify hash
    const isValid = await bcrypt.compare(otp, user.otpCode)

    if (isValid) {
      // Clear OTP after successful verification
      await prisma.user.update({
        where: { id: userId },
        data: {
          otpCode: null,
          otpExpiresAt: null,
          phoneVerified: true,
          status: 'ACTIVE',
        },
      })
    }

    return isValid
  }

  /**
   * Send generic SMS
   */
  static async sendSMS(phone: string, message: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone)

    try {
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': AT_API_KEY,
          },
          body: new URLSearchParams({
            username: AT_USERNAME,
            to: normalizedPhone,
            message: message,
            from: AT_SENDER_ID,
          }),
        })

        return response.ok
      }

      console.log(`[DEV SMS] To: ${normalizedPhone}, Message: ${message}`)
      return true
    } catch (error) {
      console.error('SMS service error:', error)
      return false
    }
  }

  /**
   * Normalize Kenyan phone number to 254XXXXXXXXX format
   */
  static normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '')

    if (cleaned.startsWith('+254')) {
      return cleaned.substring(1)
    }

    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1)
    }

    if (!cleaned.startsWith('254')) {
      return '254' + cleaned
    }

    return cleaned
  }
}
