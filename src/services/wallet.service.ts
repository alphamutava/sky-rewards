import { prisma } from '@/lib/prisma'
import { AppError, InsufficientBalanceError, NotFoundError } from '@/lib/errors'
import { Prisma } from '@prisma/client'
import type { TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client'

const Decimal = Prisma.Decimal
type Decimal = Prisma.Decimal

export interface CreditWalletInput {
  userId: string
  amount: Decimal | number
  type: TransactionType
  reference: string
  description: string
  campaignId?: string
  metadata?: any
  method?: PaymentMethod
}

export interface DebitWalletInput {
  userId: string
  amount: Decimal | number
  type: TransactionType
  reference: string
  description: string
  campaignId?: string
  metadata?: any
  method?: PaymentMethod
}

export interface TransferInput {
  fromUserId: string
  toUserId: string
  amount: Decimal | number
  type: TransactionType
  reference: string
  description: string
  campaignId?: string
}

export class WalletService {
  /**
   * Credit user wallet
   */
  static async credit(input: CreditWalletInput): Promise<any> {
    const { userId, amount, type, reference, description, campaignId, metadata, method = 'WALLET' } = input

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, totalEarned: true },
      })

      if (!user) {
        throw new NotFoundError('User')
      }

      const balanceBefore = user.walletBalance
      const balanceAfter = new Decimal(balanceBefore).plus(amount)

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          status: 'COMPLETED',
          method,
          amount,
          fee: new Decimal(0),
          netAmount: amount,
          referenceCode: reference,
          transactionDesc: description,
          campaignId,
          completedAt: new Date(),
          metadata: metadata || {},
        },
      })

      // Update user balance
      const updateData: any = {
        walletBalance: balanceAfter,
      }

      // Update total earned for creator/view rewards
      if (type === 'CREATOR_PAYOUT' || type === 'VIEW_REWARD' || type === 'ELITE_BONUS') {
        updateData.totalEarned = new Decimal(user.totalEarned || 0).plus(amount)
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      })

      return { transaction, balanceBefore, balanceAfter }
    })

    return result
  }

  /**
   * Debit user wallet
   */
  static async debit(input: DebitWalletInput): Promise<any> {
    const { userId, amount, type, reference, description, campaignId, metadata, method = 'WALLET' } = input

    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, totalWithdrawn: true },
      })

      if (!user) {
        throw new NotFoundError('User')
      }

      const balanceBefore = user.walletBalance

      // Check sufficient balance
      if (new Decimal(balanceBefore).lessThan(amount)) {
        throw new InsufficientBalanceError()
      }

      const balanceAfter = new Decimal(balanceBefore).minus(amount)

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          status: 'COMPLETED',
          method,
          amount,
          fee: new Decimal(0),
          netAmount: amount,
          referenceCode: reference,
          transactionDesc: description,
          campaignId,
          completedAt: new Date(),
          metadata: metadata || {},
        },
      })

      // Update user balance
      const updateData: any = {
        walletBalance: balanceAfter,
      }

      // Update total withdrawn
      if (type === 'WITHDRAWAL') {
        updateData.totalWithdrawn = new Decimal(user.totalWithdrawn || 0).plus(amount)
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      })

      return { transaction, balanceBefore, balanceAfter }
    })

    return result
  }

  /**
   * Transfer between users
   */
  static async transfer(input: TransferInput): Promise<{ debit: any; credit: any }> {
    const { fromUserId, toUserId, amount, type, reference, description, campaignId } = input

    const result = await prisma.$transaction(async (tx) => {
      // Debit from sender
      const sender = await tx.user.findUnique({
        where: { id: fromUserId },
        select: { walletBalance: true },
      })

      if (!sender) {
        throw new NotFoundError('Sender')
      }

      if (new Decimal(sender.walletBalance).lessThan(amount)) {
        throw new InsufficientBalanceError()
      }

      const senderBalanceAfter = new Decimal(sender.walletBalance).minus(amount)

      const debitTransaction = await tx.transaction.create({
        data: {
          userId: fromUserId,
          type,
          status: 'COMPLETED',
          method: 'WALLET',
          amount,
          fee: new Decimal(0),
          netAmount: amount,
          referenceCode: `${reference}-DEBIT`,
          transactionDesc: `${description} (to: ${toUserId})`,
          campaignId,
          completedAt: new Date(),
        },
      })

      await tx.user.update({
        where: { id: fromUserId },
        data: { walletBalance: senderBalanceAfter },
      })

      // Credit to receiver
      const receiver = await tx.user.findUnique({
        where: { id: toUserId },
        select: { walletBalance: true, totalEarned: true },
      })

      if (!receiver) {
        throw new NotFoundError('Receiver')
      }

      const receiverBalanceAfter = new Decimal(receiver.walletBalance).plus(amount)

      const creditTransaction = await tx.transaction.create({
        data: {
          userId: toUserId,
          type,
          status: 'COMPLETED',
          method: 'WALLET',
          amount,
          fee: new Decimal(0),
          netAmount: amount,
          referenceCode: `${reference}-CREDIT`,
          transactionDesc: `${description} (from: ${fromUserId})`,
          campaignId,
          completedAt: new Date(),
        },
      })

      await tx.user.update({
        where: { id: toUserId },
        data: {
          walletBalance: receiverBalanceAfter,
          totalEarned: new Decimal(receiver.totalEarned || 0).plus(amount),
        },
      })

      return { debit: debitTransaction, credit: creditTransaction }
    })

    return result
  }

  /**
   * Get user balance
   */
  static async getBalance(userId: string): Promise<Prisma.Decimal> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user.walletBalance
  }

  /**
   * Get transaction history
   */
  static async getTransactions(params: {
    userId: string
    type?: TransactionType
    status?: TransactionStatus
    page: number
    limit: number
    startDate?: Date
    endDate?: Date
  }) {
    const { userId, type, status, page, limit, startDate, endDate } = params

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(type && { type }),
      ...(status && { status }),
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
   * Create pending transaction (for M-Pesa flows)
   */
  static async createPendingTransaction(input: {
    userId: string
    type: TransactionType
    amount: Decimal | number
    reference: string
    description: string
    method: PaymentMethod
    campaignId?: string
    phoneNumber?: string
    accountReference?: string
    metadata?: any
  }): Promise<any> {
    const transaction = await prisma.transaction.create({
      data: {
        userId: input.userId,
        type: input.type,
        status: 'PENDING',
        method: input.method,
        amount: input.amount,
        fee: new Decimal(0),
        netAmount: input.amount,
        referenceCode: input.reference,
        transactionDesc: input.description,
        campaignId: input.campaignId,
        phoneNumber: input.phoneNumber,
        accountReference: input.accountReference,
        metadata: input.metadata || {},
      },
    })

    return transaction
  }

  /**
   * Complete pending transaction
   */
  static async completeTransaction(
    transactionId: string,
    mpesaReceiptNo?: string,
    metadata?: any
  ): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true },
      })

      if (!transaction) {
        throw new NotFoundError('Transaction')
      }

      if (transaction.status !== 'PENDING') {
        throw new AppError('Transaction is not pending', 400, 'INVALID_STATUS')
      }

      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          mpesaReceiptNo,
          completedAt: new Date(),
          ...(metadata && { metadata: { ...(transaction.metadata as any), ...metadata } }),
        },
      })

      // Update user balance based on transaction type
      const user = transaction.user
      let newBalance = user.walletBalance

      if (transaction.type === 'DEPOSIT') {
        newBalance = new Decimal(user.walletBalance).plus(transaction.amount)
      } else if (transaction.type === 'WITHDRAWAL') {
        newBalance = new Decimal(user.walletBalance).minus(transaction.amount)
      }

      await tx.user.update({
        where: { id: transaction.userId },
        data: { walletBalance: newBalance },
      })

      return updatedTransaction
    })
  }

  /**
   * Fail a transaction
   */
  static async failTransaction(
    transactionId: string,
    failureReason: string
  ): Promise<any> {
    return prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        failureReason,
      },
    })
  }
}
