import { prisma } from '@/lib/prisma'

/**
 * Generate daily system report
 */
export async function generateDailyReport(): Promise<void> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // User stats
    const [newUsers, activeUsers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: yesterday,
          },
        },
      }),
    ])

    // Transaction stats
    const [deposits, withdrawals, viewRewards] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'VIEW_REWARD',
          status: 'COMPLETED',
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Campaign stats
    const [newCampaigns, newSubmissions] = await Promise.all([
      prisma.campaign.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
      prisma.submission.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
    ])

    // View stats
    const totalViews = await prisma.view.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        isValid: true,
      },
    })

    const report = {
      date: yesterday.toISOString().split('T')[0],
      users: {
        new: newUsers,
        active: activeUsers,
      },
      transactions: {
        deposits: {
          count: deposits._count,
          total: deposits._sum.amount?.toNumber() || 0,
        },
        withdrawals: {
          count: withdrawals._count,
          total: withdrawals._sum.amount?.toNumber() || 0,
        },
        viewRewards: {
          count: viewRewards._count,
          total: viewRewards._sum.amount?.toNumber() || 0,
        },
      },
      content: {
        newCampaigns,
        newSubmissions,
        totalViews,
      },
    }

    console.log('[DailyReport] Generated report:', JSON.stringify(report, null, 2))

    // Store report in database (optional)
    await prisma.systemSetting.upsert({
      where: { key: `daily_report_${report.date}` },
      update: { value: JSON.stringify(report) },
      create: {
        key: `daily_report_${report.date}`,
        value: JSON.stringify(report),
        description: `Daily system report for ${report.date}`,
      },
    })
  } catch (error) {
    console.error('[DailyReport] Error generating report:', error)
  }
}
