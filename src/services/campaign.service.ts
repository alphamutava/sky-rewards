import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors'
import { slugify, generateReference } from '@/lib/utils'
import type { CampaignType, CampaignStatus, Prisma } from '@prisma/client'

export interface CreateCampaignInput {
  title: string
  description: string
  brief: string
  type: CampaignType
  totalBudget: number
  startDate: string
  endDate: string
  rewardPerView?: number
  creatorReward?: number
  targetCounty?: string
  targetAgeMin?: number
  targetAgeMax?: number
  targetGender?: string
  tags?: string[]
  maxSubmissions?: number
  maxViewsPerSubmission?: number
}

export interface CampaignFilters {
  status?: CampaignStatus
  type?: CampaignType
  advertiserId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class CampaignService {
  /**
   * Create a new campaign
   */
  static async create(advertiserId: string, input: CreateCampaignInput): Promise<any> {
    // Validate dates
    const startDate = new Date(input.startDate)
    const endDate = new Date(input.endDate)
    const now = new Date()

    if (startDate < now) {
      throw new ValidationError('Start date must be in the future')
    }

    if (endDate <= startDate) {
      throw new ValidationError('End date must be after start date')
    }

    // Validate budget
    const minBudget = 5000
    if (input.totalBudget < minBudget) {
      throw new ValidationError(`Minimum campaign budget is KES ${minBudget}`)
    }

    // Generate unique slug
    let slug = slugify(input.title)
    let counter = 1
    const baseSlug = slug

    while (await prisma.campaign.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const campaign = await prisma.campaign.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        brief: input.brief,
        type: input.type,
        status: 'DRAFT',
        totalBudget: 0, // Will be set when funded
        remainingBudget: 0,
        platformFee: 0,
        rewardPerView: input.rewardPerView || 0.5,
        creatorReward: input.creatorReward || 0,
        startDate,
        endDate,
        targetCounty: input.targetCounty,
        targetAgeMin: input.targetAgeMin,
        targetAgeMax: input.targetAgeMax,
        targetGender: input.targetGender,
        tags: input.tags || [],
        maxSubmissions: input.maxSubmissions || 50,
        maxViewsPerSubmission: input.maxViewsPerSubmission || 10000,
        advertiserId,
      },
    })

    return campaign
  }

  /**
   * Get campaign by ID or slug
   */
  static async getByIdOrSlug(idOrSlug: string): Promise<any> {
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        advertiser: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!campaign) {
      throw new NotFoundError('Campaign')
    }

    return campaign
  }

  /**
   * List campaigns with filters
   */
  static async list(filters: CampaignFilters): Promise<any> {
    const {
      status,
      type,
      advertiserId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters

    const cacheKey = `campaigns:list:${JSON.stringify(filters)}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const where: Prisma.CampaignWhereInput = {
      ...(status && { status }),
      ...(type && { type }),
      ...(advertiserId && { advertiserId }),
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          advertiser: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ])

    const result = {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    await redis.setex(cacheKey, 60, JSON.stringify(result))
    return result
  }

  /**
   * Update campaign
   */
  static async update(
    campaignId: string,
    advertiserId: string,
    input: Partial<CreateCampaignInput>
  ): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      throw new NotFoundError('Campaign')
    }

    if (campaign.advertiserId !== advertiserId) {
      throw new ForbiddenError('Not authorized to update this campaign')
    }

    // Can only update if DRAFT or PAUSED
    if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED') {
      throw new ValidationError('Can only update draft or paused campaigns')
    }

    const updateData: Prisma.CampaignUpdateInput = {}

    if (input.title) updateData.title = input.title
    if (input.description) updateData.description = input.description
    if (input.brief) updateData.brief = input.brief
    if (input.type) updateData.type = input.type
    if (input.targetCounty) updateData.targetCounty = input.targetCounty
    if (input.targetAgeMin !== undefined) updateData.targetAgeMin = input.targetAgeMin
    if (input.targetAgeMax !== undefined) updateData.targetAgeMax = input.targetAgeMax
    if (input.targetGender) updateData.targetGender = input.targetGender
    if (input.tags) updateData.tags = input.tags
    if (input.maxSubmissions) updateData.maxSubmissions = input.maxSubmissions
    if (input.maxViewsPerSubmission)
      updateData.maxViewsPerSubmission = input.maxViewsPerSubmission
    if (input.rewardPerView) updateData.rewardPerView = input.rewardPerView
    if (input.creatorReward !== undefined) updateData.creatorReward = input.creatorReward

    if (input.startDate) updateData.startDate = new Date(input.startDate)
    if (input.endDate) updateData.endDate = new Date(input.endDate)

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
    })

    return updated
  }

  /**
   * Update campaign status
   */
  static async updateStatus(
    campaignId: string,
    status: CampaignStatus,
    userId: string,
    userRole: string
  ): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      throw new NotFoundError('Campaign')
    }

    // Only admin can approve/reject
    if (['PENDING_APPROVAL', 'ACTIVE'].includes(status) && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only admins can approve campaigns')
    }

    // Advertiser can pause/resume their own campaigns
    if (['PAUSED', 'CANCELLED'].includes(status) && campaign.advertiserId !== userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Not authorized to modify this campaign')
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status },
    })

    return updated
  }

  /**
   * Get campaign statistics
   */
  static async getStats(campaignId: string): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        submissions: {
          select: {
            status: true,
            viewCount: true,
            totalEarned: true,
          },
        },
        transactions: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            type: true,
            amount: true,
          },
        },
      },
    })

    if (!campaign) {
      throw new NotFoundError('Campaign')
    }

    const totalViews = campaign.submissions.reduce((sum, s) => sum + s.viewCount, 0)
    const approvedSubmissions = campaign.submissions.filter((s) => s.status === 'APPROVED').length
    const totalPaid = campaign.submissions.reduce((sum, s) => sum + (s.totalEarned?.toNumber() || 0), 0)

    return {
      campaignId,
      totalSubmissions: campaign.submissions.length,
      approvedSubmissions,
      totalViews,
      totalSpent: totalPaid,
      remainingBudget: campaign.remainingBudget,
      totalBudget: campaign.totalBudget,
      platformFee: campaign.platformFee,
      transactions: campaign.transactions,
    }
  }

  /**
   * Expire campaigns past end date
   */
  static async expireCampaigns(): Promise<number> {
    const now = new Date()

    const campaignsToExpire = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
    })

    for (const campaign of campaignsToExpire) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'EXPIRED' },
      })

      // Refund remaining budget to advertiser
      if (campaign.remainingBudget.greaterThan(0)) {
        // Create refund transaction logic here
        // This would involve crediting the advertiser's wallet
      }
    }

    return campaignsToExpire.length
  }
}
