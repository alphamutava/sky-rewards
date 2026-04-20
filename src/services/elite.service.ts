import { prisma } from '@/lib/prisma'
import { NotificationService } from './notification.service'
import type { Prisma } from '@prisma/client'

export class EliteService {
  private static readonly ELITE_COUNT = 100

  /**
   * Calculate elite score for a creator
   */
  static calculateEliteScore(user: any): number {
    const totalApproved = user.totalApproved || 0
    const averageRating = user.averageRating?.toNumber() || 0
    const totalViews = user.totalViews || 0
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Formula: (totalApproved * 10) + (averageRating * 20) + (totalViews * 0.001) + (accountAge_days * 0.1)
    const score =
      totalApproved * 10 +
      averageRating * 20 +
      totalViews * 0.001 +
      accountAgeDays * 0.1

    return Math.round(score * 100) / 100
  }

  /**
   * Update elite rankings
   */
  static async updateRankings(): Promise<any> {
    // Get all creators with at least 5 approved submissions
    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR',
        status: 'ACTIVE',
        totalApproved: { gte: 5 },
      },
      orderBy: {
        totalApproved: 'desc',
      },
    })

    // Calculate elite scores
    const scoredCreators = creators.map((creator) => ({
      ...creator,
      eliteScore: this.calculateEliteScore(creator),
    }))

    // Sort by elite score descending
    scoredCreators.sort((a, b) => b.eliteScore - a.eliteScore)

    // Get current elite members
    const currentElite = await prisma.user.findMany({
      where: { isElite: true },
      select: { id: true, eliteRank: true },
    })
    const currentEliteIds = new Set(currentElite.map((e) => e.id))

    // Track promotions and demotions
    const promoted: string[] = []
    const demoted: string[] = []

    // Update top 100
    for (let i = 0; i < scoredCreators.length; i++) {
      const creator = scoredCreators[i]
      const newRank = i + 1

      if (newRank <= this.ELITE_COUNT) {
        // Should be elite
        if (!creator.isElite) {
          // Promoted
          promoted.push(creator.id)
          await NotificationService.notifyElitePromoted(creator.id, newRank)
        }

        await prisma.user.update({
          where: { id: creator.id },
          data: {
            isElite: true,
            eliteRank: newRank,
            eliteScore: new Prisma.Decimal(creator.eliteScore),
            eliteJoinedAt: creator.eliteJoinedAt || new Date(),
          },
        })
      } else {
        // Should not be elite
        if (creator.isElite) {
          // Demoted
          demoted.push(creator.id)
          await NotificationService.notifyEliteDemoted(creator.id)
        }

        await prisma.user.update({
          where: { id: creator.id },
          data: {
            isElite: false,
            eliteRank: null,
            eliteScore: new Prisma.Decimal(creator.eliteScore),
          },
        })
      }
    }

    return {
      updated: scoredCreators.length,
      promoted: promoted.length,
      demoted: demoted.length,
      top10: scoredCreators.slice(0, 10).map((c) => ({
        id: c.id,
        displayName: c.displayName,
        eliteScore: c.eliteScore,
        rank: scoredCreators.indexOf(c) + 1,
      })),
    }
  }

  /**
   * Get current Elite 100
   */
  static async getElite100(): Promise<any> {
    const elite = await prisma.user.findMany({
      where: { isElite: true },
      orderBy: { eliteRank: 'asc' },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        eliteRank: true,
        eliteScore: true,
        eliteJoinedAt: true,
        totalApproved: true,
        totalViews: true,
        averageRating: true,
      },
    })

    return elite
  }

  /**
   * Get full leaderboard
   */
  static async getLeaderboard(page: number = 1, limit: number = 50): Promise<any> {
    const where = {
      role: 'CREATOR',
      status: 'ACTIVE',
    }

    const [creators, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { totalApproved: 'desc' },
        select: {
          id: true,
          displayName: true,
          avatar: true,
          isElite: true,
          eliteRank: true,
          eliteScore: true,
          totalApproved: true,
          totalSubmissions: true,
          totalViews: true,
          averageRating: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      creators,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Apply for Elite consideration
   */
  static async applyForElite(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'CREATOR') {
      throw new Error('Only creators can apply for Elite status')
    }

    if (user.isElite) {
      throw new Error('You are already an Elite member')
    }

    if (user.totalApproved < 5) {
      throw new Error('You need at least 5 approved submissions to apply')
    }

    // Calculate current score
    const score = this.calculateEliteScore(user)

    // Store application (in a real app, you'd have an applications table)
    return {
      userId,
      currentScore: score,
      totalApproved: user.totalApproved,
      message:
        'Application recorded. Elite rankings are updated daily at midnight.',
    }
  }
}
