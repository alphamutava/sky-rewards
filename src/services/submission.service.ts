import { prisma } from '@/lib/prisma'
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '@/lib/errors'
import { NotificationService } from './notification.service'
import { WalletService } from './wallet.service'
import { generateReference } from '@/lib/utils'
import type { SubmissionStatus, Prisma } from '@prisma/client'

export interface CreateSubmissionInput {
  title: string
  description?: string
  mediaUrl: string
  mediaType: string
  thumbnailUrl?: string
  duration?: number
  fileSize?: number
}

export interface ReviewSubmissionInput {
  decision: SubmissionStatus
  qualityScore?: number
  feedback?: string
  rejectionReason?: string
}

export class SubmissionService {
  /**
   * Create a new submission
   */
  static async create(
    creatorId: string,
    campaignId: string,
    input: CreateSubmissionInput
  ): Promise<any> {
    // Check if campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!campaign) {
      throw new NotFoundError('Campaign')
    }

    if (campaign.status !== 'ACTIVE') {
      throw new ValidationError('Campaign is not active')
    }

    // Check max submissions limit
    if (campaign._count.submissions >= campaign.maxSubmissions) {
      throw new ValidationError('Campaign has reached maximum submissions limit')
    }

    // Check if user already submitted to this campaign
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        creatorId_campaignId: {
          creatorId,
          campaignId,
        },
      },
    })

    if (existingSubmission) {
      throw new ConflictError('You have already submitted to this campaign')
    }

    // Check campaign dates
    const now = new Date()
    if (now < campaign.startDate || now > campaign.endDate) {
      throw new ValidationError('Campaign is not accepting submissions at this time')
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        creatorId,
        campaignId,
        title: input.title,
        description: input.description,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        thumbnailUrl: input.thumbnailUrl,
        duration: input.duration,
        fileSize: input.fileSize,
        status: 'PENDING',
        viewCount: 0,
        uniqueViewers: 0,
        totalEarned: 0,
        creatorEarned: 0,
      },
    })

    // Update campaign submission count
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalSubmissions: { increment: 1 },
      },
    })

    // Update user submission count
    await prisma.user.update({
      where: { id: creatorId },
      data: {
        totalSubmissions: { increment: 1 },
      },
    })

    return submission
  }

  /**
   * Get submission by ID
   */
  static async getById(submissionId: string, userId?: string): Promise<any> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isElite: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            status: true,
            rewardPerView: true,
            creatorReward: true,
            advertiser: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        views: userId ? {
          where: { viewerId: userId },
        } : false,
        _count: {
          select: { views: true },
        },
      },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    return submission
  }

  /**
   * List submissions with filters
   */
  static async list(params: {
    creatorId?: string
    campaignId?: string
    status?: SubmissionStatus
    page: number
    limit: number
  }): Promise<any> {
    const { creatorId, campaignId, status, page, limit } = params

    const where: Prisma.SubmissionWhereInput = {
      ...(creatorId && { creatorId }),
      ...(campaignId && { campaignId }),
      ...(status && { status }),
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
            },
          },
        },
      }),
      prisma.submission.count({ where }),
    ])

    return {
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Review a submission (Admin only)
   */
  static async review(
    submissionId: string,
    reviewerId: string,
    input: ReviewSubmissionInput
  ): Promise<any> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        campaign: true,
        creator: true,
      },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    if (submission.status !== 'PENDING' && submission.status !== 'IN_REVIEW') {
      throw new ValidationError('Submission has already been reviewed')
    }

    // Create review record
    await prisma.review.create({
      data: {
        submissionId,
        reviewerId,
        decision: input.decision,
        qualityScore: input.qualityScore ? new Prisma.Decimal(input.qualityScore) : null,
        feedback: input.feedback,
      },
    })

    // Update submission
    const updateData: Prisma.SubmissionUpdateInput = {
      status: input.decision,
    }

    if (input.decision === 'REJECTED') {
      updateData.rejectionReason = input.rejectionReason
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: updateData,
    })

    // If approved, credit creator and update campaign
    if (input.decision === 'APPROVED') {
      const creatorReward = submission.campaign.creatorReward

      if (creatorReward && creatorReward.greaterThan(0)) {
        // Credit creator wallet
        await WalletService.credit({
          userId: submission.creatorId,
          amount: creatorReward,
          type: 'CREATOR_PAYOUT',
          reference: generateReference('CRP'),
          description: `Reward for approved submission: ${submission.title}`,
          campaignId: submission.campaignId,
          method: 'WALLET',
        })

        // Update submission earnings
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            creatorEarned: creatorReward,
            totalEarned: creatorReward,
          },
        })

        // Update creator stats
        await prisma.user.update({
          where: { id: submission.creatorId },
          data: {
            totalApproved: { increment: 1 },
          },
        })

        // Notify creator
        await NotificationService.notifySubmissionApproved(
          submission.creatorId,
          submission.title,
          creatorReward.toNumber()
        )
      }

      // Update campaign
      await prisma.campaign.update({
        where: { id: submission.campaignId },
        data: {
          approvedSubmissions: { increment: 1 },
        },
      })
    } else if (input.decision === 'REJECTED') {
      // Notify creator of rejection
      await NotificationService.notifySubmissionRejected(
        submission.creatorId,
        submission.title,
        input.rejectionReason || 'No specific reason provided'
      )
    }

    return updatedSubmission
  }

  /**
   * Get submissions pending review (Admin)
   */
  static async getPendingReview(page: number = 1, limit: number = 20): Promise<any> {
    return this.list({
      status: 'PENDING',
      page,
      limit,
    })
  }

  /**
   * Get approved submissions for a campaign (for viewing)
   */
  static async getApprovedByCampaign(campaignId: string, page: number = 1, limit: number = 20): Promise<any> {
    return this.list({
      campaignId,
      status: 'APPROVED',
      page,
      limit,
    })
  }
}
