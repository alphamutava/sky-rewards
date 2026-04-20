import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class AdminService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      totalCreators,
      totalAdvertisers,
      totalCampaigns,
      activeCampaigns,
      totalSubmissions,
      pendingReviews,
      totalTransactionVolume,
      platformRevenue,
      pendingPayouts,
      todaySignups,
      todayDeposits,
      todayPayouts,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'CREATOR' } }),
      prisma.user.count({ where: { role: 'ADVERTISER' } }),

      // Campaigns
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),

      // Submissions
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'PENDING' } }),

      // Financial
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'PLATFORM_COMMISSION',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'WITHDRAWAL',
          status: 'PENDING',
        },
        _sum: { amount: true },
      }),

      // Today stats
      this.getTodaySignups(),
      this.getTodayDeposits(),
      this.getTodayPayouts(),
    ])

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        creators: totalCreators,
        advertisers: totalAdvertisers,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
      },
      submissions: {
        total: totalSubmissions,
        pendingReviews,
      },
      financial: {
        totalTransactionVolume: totalTransactionVolume._sum.amount?.toNumber() || 0,
        platformRevenue: platformRevenue._sum.amount?.toNumber() || 0,
        pendingPayouts: pendingPayouts._sum.amount?.toNumber() || 0,
        todayDeposits,
        todayPayouts,
      },
      today: {
        signups: todaySignups,
      },
    }
  }

  /**
   * Get users list with filters
   */
  static async getUsers(params: {
    role?: string
    status?: string
    search?: string
    page: number
    limit: number
  }): Promise<any> {
    const { role, status, search, page, limit } = params

    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as any }),
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { phone: { contains: search } },
          { email: { contains: search } },
          { displayName: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          role: true,
          status: true,
          walletBalance: true,
          isElite: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get transactions with filters
   */
  static async getTransactions(params: {
    status?: string
    type?: string
    userId?: string
    page: number
    limit: number
  }): Promise<any> {
    const { status, type, userId, page, limit } = params

    const where: Prisma.TransactionWhereInput = {
      ...(status && { status: status as any }),
      ...(type && { type: type as any }),
      ...(userId && { userId }),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              phone: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Update user status (suspend/activate/ban)
   */
  static async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  ): Promise<any> {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    })
  }

  /**
   * Get pending payouts
   */
  static async getPendingPayouts(page: number = 1, limit: number = 20): Promise<any> {
    const where: Prisma.TransactionWhereInput = {
      type: 'WITHDRAWAL' as any,
      status: 'PENDING' as any,
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get submissions for admin review
   */
  static async getSubmissions(params: {
    page?: number
    limit?: number
    status?: string
  }): Promise<{ submissions: any[]; total: number }> {
    const { page = 1, limit = 20, status } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              phone: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
          reviews: {
            include: {
              reviewer: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ])

    return { submissions, total }
  }

  /**
   * Get system settings
   */
  static async getSystemSettings(): Promise<any> {
    const settings = await prisma.systemSetting.findMany()
    
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Update system setting
   */
  static async updateSystemSetting(
    key: string,
    value: string,
    description?: string
  ): Promise<any> {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, description },
    })
  }

  // Helper methods
  private static async getTodaySignups(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return prisma.user.count({
      where: {
        createdAt: { gte: today },
      },
    })
  }

  private static async getTodayDeposits(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    })

    return result._sum.amount?.toNumber() || 0
  }

  private static async getTodayPayouts(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = await prisma.transaction.aggregate({
      where: {
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    })

    return result._sum.amount?.toNumber() || 0
  }
}
