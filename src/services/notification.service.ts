import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
}

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export class NotificationService {
  /**
   * Create in-app notification
   */
  static async create(input: CreateNotificationInput): Promise<any> {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || {},
        read: false,
      },
    })

    return notification
  }

  /**
   * Send email notification
   */
  static async sendEmail(input: SendEmailInput): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.log('[Email] No Resend API key configured')
      return false
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@skykenya.co.ke',
          to: input.to,
          subject: input.subject,
          html: input.html,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Email sending failed:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Email service error:', error)
      return false
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ])

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    })
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    })

    if (!notification) {
      throw new Error('Notification not found')
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<any> {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * Notify user of submission approval
   */
  static async notifySubmissionApproved(userId: string, submissionTitle: string, amount: number): Promise<void> {
    await this.create({
      userId,
      type: 'SUBMISSION_APPROVED',
      title: 'Submission Approved!',
      message: `Your submission "${submissionTitle}" has been approved. You earned KES ${amount}.`,
    })
  }

  /**
   * Notify user of submission rejection
   */
  static async notifySubmissionRejected(userId: string, submissionTitle: string, reason: string): Promise<void> {
    await this.create({
      userId,
      type: 'SUBMISSION_REJECTED',
      title: 'Submission Not Approved',
      message: `Your submission "${submissionTitle}" was not approved. Reason: ${reason}`,
    })
  }

  /**
   * Notify user of payment received
   */
  static async notifyPaymentReceived(userId: string, amount: number, type: string): Promise<void> {
    await this.create({
      userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `You received KES ${amount} via ${type}.`,
    })
  }

  /**
   * Notify user of payout sent
   */
  static async notifyPayoutSent(userId: string, amount: number): Promise<void> {
    await this.create({
      userId,
      type: 'PAYOUT_SENT',
      title: 'Payout Sent',
      message: `Your withdrawal of KES ${amount} has been sent to your M-Pesa.`,
    })
  }

  /**
   * Notify user of campaign funding
   */
  static async notifyCampaignFunded(userId: string, campaignTitle: string, amount: number): Promise<void> {
    await this.create({
      userId,
      type: 'CAMPAIGN_FUNDED',
      title: 'Campaign Funded',
      message: `Your campaign "${campaignTitle}" has been funded with KES ${amount} and is awaiting approval.`,
    })
  }

  /**
   * Notify user of campaign expiration
   */
  static async notifyCampaignExpired(userId: string, campaignTitle: string): Promise<void> {
    await this.create({
      userId,
      type: 'CAMPAIGN_EXPIRED',
      title: 'Campaign Expired',
      message: `Your campaign "${campaignTitle}" has expired.`,
    })
  }

  /**
   * Notify user of Elite promotion
   */
  static async notifyElitePromoted(userId: string, rank: number): Promise<void> {
    await this.create({
      userId,
      type: 'ELITE_PROMOTED',
      title: 'Welcome to The Elite 100!',
      message: `Congratulations! You've been promoted to The Elite 100 with rank #${rank}. Enjoy 1.5x earnings on all views!`,
    })
  }

  /**
   * Notify user of Elite demotion
   */
  static async notifyEliteDemoted(userId: string): Promise<void> {
    await this.create({
      userId,
      type: 'ELITE_DEMOTED',
      title: 'Elite Status Update',
      message: 'You have been removed from The Elite 100. Keep creating great content to rejoin!',
    })
  }
}
