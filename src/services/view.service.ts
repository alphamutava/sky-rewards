import { prisma } from '@/lib/prisma'
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors'
import { NotificationService } from './notification.service'
import { WalletService } from './wallet.service'
import { generateReference, getStartOfDay, getEndOfDay } from '@/lib/utils'
import type { Prisma } from '@prisma/client'

export interface TrackViewInput {
  submissionId: string
  viewerId: string
  watchDuration: number
  completionPercent: number
  ipAddress?: string
  userAgent?: string
}

export class ViewService {
  // Minimum watch percentage to earn (30%)
  private static readonly MIN_COMPLETION_PERCENT = 30
  // Minimum seconds for short content
  private static readonly MIN_WATCH_SECONDS = 10
  // Default view reward
  private static readonly DEFAULT_VIEW_REWARD = 0.5
  // Max daily earnings per viewer
  private static readonly MAX_DAILY_EARNINGS = 500

  /**
   * Track a view and reward viewer
   */
  static async trackView(input: TrackViewInput): Promise<any> {
    const { submissionId, viewerId, watchDuration, completionPercent, ipAddress, userAgent } = input

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        campaign: true,
        creator: {
          select: {
            isElite: true,
          },
        },
      },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    // Only approved submissions can be viewed for rewards
    if (submission.status !== 'APPROVED') {
      throw new ValidationError('Content is not yet approved for viewing')
    }

    // Check if already viewed by this user
    const existingView = await prisma.view.findUnique({
      where: {
        submissionId_viewerId: {
          submissionId,
          viewerId,
        },
      },
    })

    if (existingView) {
      throw new ConflictError('You have already viewed this content')
    }

    // Anti-fraud checks
    const isValid = await this.validateView(input, submission.duration || 0)

    // Calculate earnings
    let earned = new Prisma.Decimal(0)

    if (isValid) {
      // Get view reward amount
      const baseReward = submission.campaign.rewardPerView || this.DEFAULT_VIEW_REWARD
      let reward = baseReward

      // Apply elite bonus
      if (submission.creator.isElite) {
        const multiplier = parseFloat(process.env.ELITE_BONUS_MULTIPLIER || '1.5')
        reward = reward.times(multiplier)
      }

      // Check daily earning cap
      const todayEarnings = await this.getTodayEarnings(viewerId)
      const maxDaily = parseFloat(process.env.MAX_DAILY_VIEW_EARNINGS_KES || '500')

      if (todayEarnings + reward.toNumber() > maxDaily) {
        // Cap the reward
        const remaining = maxDaily - todayEarnings
        if (remaining > 0) {
          reward = new Prisma.Decimal(remaining)
        } else {
          reward = new Prisma.Decimal(0)
        }
      }

      earned = reward

      // Check campaign budget
      if (submission.campaign.remainingBudget.lessThan(earned)) {
        // Campaign out of budget
        earned = new Prisma.Decimal(0)
      }
    }

    // Create view record (catch race condition on unique constraint)
    let view;
    try {
      view = await prisma.view.create({
        data: {
          submissionId,
          viewerId,
          watchDuration,
          completionPercent: new Prisma.Decimal(completionPercent),
          earned,
          ipAddress,
          userAgent,
          isValid,
          flagReason: isValid ? null : 'Failed validation checks',
        },
      })
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError('You have already viewed this content')
      }
      throw error
    }

    // If valid and earned > 0, process rewards
    if (isValid && earned.greaterThan(0)) {
      // Credit viewer
      await WalletService.credit({
        userId: viewerId,
        amount: earned,
        type: 'VIEW_REWARD',
        reference: generateReference('VWR'),
        description: `View reward for: ${submission.title}`,
        campaignId: submission.campaignId,
        method: 'WALLET',
      })

      // Update viewer stats
      await prisma.user.update({
        where: { id: viewerId },
        data: {
          totalViews: { increment: 1 },
        },
      })

      // Update submission earnings
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          viewCount: { increment: 1 },
          uniqueViewers: { increment: 1 },
          totalEarned: { increment: earned.toNumber() },
        },
      })

      // Update campaign
      await prisma.campaign.update({
        where: { id: submission.campaignId },
        data: {
          totalViews: { increment: 1 },
          totalSpent: { increment: earned.toNumber() },
          remainingBudget: { decrement: earned.toNumber() },
        },
      })

      // Check if campaign is out of budget
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: submission.campaignId },
      })

      if (updatedCampaign && updatedCampaign.remainingBudget.lessThan(earned)) {
        // Mark campaign as completed
        await prisma.campaign.update({
          where: { id: submission.campaignId },
          data: { status: 'COMPLETED' },
        })
      }
    }

    return {
      view,
      earned: earned.toNumber(),
      isValid,
      message: isValid
        ? earned.greaterThan(0)
          ? `You earned KES ${earned}!`
          : 'Daily earning cap reached'
        : 'View did not meet minimum requirements',
    }
  }

  /**
   * Validate view against anti-fraud rules
   */
  private static async validateView(input: TrackViewInput, contentDuration: number): Promise<boolean> {
    const { watchDuration, completionPercent, ipAddress, userAgent } = input

    // Check minimum completion percentage (30%)
    if (completionPercent < this.MIN_COMPLETION_PERCENT) {
      return false
    }

    // Check minimum watch time (at least 10 seconds)
    if (watchDuration < this.MIN_WATCH_SECONDS) {
      return false
    }

    // For longer content, ensure reasonable watch time
    if (contentDuration > 0) {
      const expectedWatchTime = contentDuration * (this.MIN_COMPLETION_PERCENT / 100)
      if (watchDuration < expectedWatchTime * 0.5) {
        // Watch time is significantly less than expected
        return false
      }
    }

    // Bot detection - basic user agent check
    if (userAgent) {
      const botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /curl/i,
        /wget/i,
        /postman/i,
      ]
      if (botPatterns.some((pattern) => pattern.test(userAgent))) {
        return false
      }
    }

    // IP-based rate limiting (max 100 views per IP per hour)
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentViewsFromIP = await prisma.view.count({
        where: {
          ipAddress,
          createdAt: { gte: oneHourAgo },
        },
      })

      if (recentViewsFromIP >= 100) {
        return false
      }
    }

    return true
  }

  /**
   * Get today's earnings for a viewer
   */
  private static async getTodayEarnings(viewerId: string): Promise<number> {
    const todayStart = getStartOfDay()
    const todayEnd = getEndOfDay()

    const result = await prisma.view.aggregate({
      where: {
        viewerId,
        isValid: true,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: {
        earned: true,
      },
    })

    return result._sum.earned?.toNumber() || 0
  }

  /**
   * Get viewer's earnings summary
   */
  static async getEarningsSummary(viewerId: string): Promise<any> {
    const today = getStartOfDay()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [todayEarnings, weekEarnings, monthEarnings, totalEarnings, totalViews] = await Promise.all([
      this.getPeriodEarnings(viewerId, today),
      this.getPeriodEarnings(viewerId, weekAgo),
      this.getPeriodEarnings(viewerId, monthAgo),
      this.getPeriodEarnings(viewerId, null),
      prisma.view.count({
        where: { viewerId, isValid: true },
      }),
    ])

    const maxDaily = parseFloat(process.env.MAX_DAILY_VIEW_EARNINGS_KES || '500')

    return {
      today: todayEarnings,
      thisWeek: weekEarnings,
      thisMonth: monthEarnings,
      total: totalEarnings,
      totalViews,
      dailyCap: maxDaily,
      dailyCapProgress: (todayEarnings / maxDaily) * 100,
    }
  }

  /**
   * Get earnings for a period
   */
  private static async getPeriodEarnings(
    viewerId: string,
    fromDate: Date | null
  ): Promise<number> {
    const where: Prisma.ViewWhereInput = {
      viewerId,
      isValid: true,
    }

    if (fromDate) {
      where.createdAt = { gte: fromDate }
    }

    const result = await prisma.view.aggregate({
      where,
      _sum: {
        earned: true,
      },
    })

    return result._sum.earned?.toNumber() || 0
  }

  /**
   * Get views for a submission
   */
  static async getSubmissionViews(
    submissionId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const [views, total] = await Promise.all([
      prisma.view.findMany({
        where: { submissionId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          viewer: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.view.count({ where: { submissionId } }),
    ])

    return {
      views,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
