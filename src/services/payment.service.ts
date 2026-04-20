import { MpesaService } from '@/lib/mpesa'
import { WalletService } from './wallet.service'
import { prisma } from '@/lib/prisma'
import { NotFoundError, PaymentError, ValidationError } from '@/lib/errors'
import type { Prisma } from '@prisma/client'

type Decimal = Prisma.Decimal

export interface DepositInput {
  userId: string
  amount: number
  phone: string
}

export interface WithdrawalInput {
  userId: string
  amount: number
  phone: string
}

export class PaymentService {
  /**
   * Process M-Pesa deposit via STK Push
   */
  static async initiateDeposit(input: DepositInput): Promise<any> {
    const { userId, amount, phone } = input

    // Validate minimum deposit
    if (amount < 1000) {
      throw new ValidationError('Minimum deposit is KES 1,000')
    }

    // Generate reference
    const reference = MpesaService.generateReference('DEP')

    // Create pending transaction
    const transaction = await WalletService.createPendingTransaction({
      userId,
      type: 'DEPOSIT',
      amount: amount as unknown as Decimal,
      reference,
      description: `M-Pesa deposit via STK Push`,
      method: 'MPESA_STK',
      phoneNumber: MpesaService.normalizePhone(phone),
      accountReference: reference,
    })

    // Initiate STK Push
    const callbackUrl = `${process.env.MPESA_CALLBACK_URL}/api/payments/mpesa/callback`

    try {
      const stkResponse = await MpesaService.stkPush({
        phone,
        amount,
        accountRef: reference,
        description: 'Sky Kenya Deposit',
        callbackUrl,
      })

      // Update transaction with M-Pesa request ID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          mpesaRequestId: stkResponse.CheckoutRequestID,
          metadata: {
            ...transaction.metadata,
            merchantRequestId: stkResponse.MerchantRequestID,
            checkoutRequestId: stkResponse.CheckoutRequestID,
          },
        },
      })

      return {
        transaction,
        stkResponse,
        message: 'STK Push sent to your phone. Please enter your M-Pesa PIN.',
      }
    } catch (error: any) {
      // Mark transaction as failed
      await WalletService.failTransaction(transaction.id, error.message)
      throw new PaymentError(`Failed to initiate deposit: ${error.message}`)
    }
  }

  /**
   * Process STK Push callback
   */
  static async processSTKCallback(body: any): Promise<any> {
    const result = MpesaService.processSTKCallback(body)

    // Find transaction by checkout request ID
    const transaction = await prisma.transaction.findFirst({
      where: {
        mpesaRequestId: result.checkoutRequestId,
      },
    })

    if (!transaction) {
      console.error('Transaction not found for callback:', result.checkoutRequestId)
      throw new NotFoundError('Transaction')
    }

    if (result.success) {
      // Complete the transaction and credit wallet
      const completed = await WalletService.completeTransaction(
        transaction.id,
        result.mpesaReceiptNumber,
        {
          phoneNumber: result.phone,
          amount: result.amount,
        }
      )

      return {
        success: true,
        transaction: completed,
        message: 'Deposit successful',
      }
    } else {
      // Mark as failed
      await WalletService.failTransaction(transaction.id, result.resultDesc)

      return {
        success: false,
        transactionId: transaction.id,
        message: result.resultDesc,
      }
    }
  }

  /**
   * Initiate withdrawal via M-Pesa B2C
   */
  static async initiateWithdrawal(input: WithdrawalInput): Promise<any> {
    const { userId, amount, phone } = input

    // Validate minimum withdrawal
    const minWithdrawal = parseInt(process.env.MIN_WITHDRAWAL_KES || '100')
    const maxWithdrawal = parseInt(process.env.MAX_WITHDRAWAL_KES || '150000')

    if (amount < minWithdrawal) {
      throw new ValidationError(`Minimum withdrawal is KES ${minWithdrawal}`)
    }

    if (amount > maxWithdrawal) {
      throw new ValidationError(`Maximum withdrawal is KES ${maxWithdrawal}`)
    }

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, totalWithdrawn: true },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    const balance = user.walletBalance
    if (balance.lessThan(amount)) {
      throw new ValidationError('Insufficient wallet balance')
    }

    // Generate reference
    const reference = MpesaService.generateReference('WTH')

    // Create pending transaction
    const transaction = await WalletService.createPendingTransaction({
      userId,
      type: 'WITHDRAWAL',
      amount: amount as unknown as Decimal,
      reference,
      description: `Withdrawal to M-Pesa`,
      method: 'MPESA_B2C',
      phoneNumber: MpesaService.normalizePhone(phone),
    })

    // Debit wallet immediately (optimistic)
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: balance.minus(amount),
        totalWithdrawn: user.totalWithdrawn.plus(amount),
      },
    })

    // Initiate B2C
    const callbackUrl = `${process.env.MPESA_B2C_CALLBACK_URL}/api/payments/mpesa/b2c-callback`
    const timeoutUrl = process.env.MPESA_B2C_TIMEOUT_URL || callbackUrl

    try {
      const b2cResponse = await MpesaService.b2cPayment({
        phone,
        amount,
        remarks: 'Sky Kenya Withdrawal',
        occasion: 'Withdrawal',
        callbackUrl,
        timeoutUrl,
      })

      // Update transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'PROCESSING',
          mpesaRequestId: b2cResponse.ConversationID,
          metadata: {
            conversationId: b2cResponse.ConversationID,
            originatorConversationId: b2cResponse.OriginatorConversationID,
          },
        },
      })

      return {
        transaction,
        b2cResponse,
        message: 'Withdrawal request submitted. You will receive M-Pesa notification shortly.',
      }
    } catch (error: any) {
      // Refund wallet on failure
      await prisma.user.update({
        where: { id: userId },
        data: {
          walletBalance: balance,
          totalWithdrawn: user.totalWithdrawn,
        },
      })

      await WalletService.failTransaction(transaction.id, error.message)
      throw new PaymentError(`Failed to initiate withdrawal: ${error.message}`)
    }
  }

  /**
   * Process B2C callback
   */
  static async processB2CCallback(body: any): Promise<any> {
    const result = MpesaService.processB2CCallback(body)

    // Find transaction by conversation ID
    const transaction = await prisma.transaction.findFirst({
      where: {
        mpesaRequestId: result.conversationId,
      },
      include: { user: true },
    })

    if (!transaction) {
      console.error('Transaction not found for B2C callback:', result.conversationId)
      throw new NotFoundError('Transaction')
    }

    if (result.success) {
      // Mark as completed
      const completed = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          mpesaReceiptNo: result.mpesaReceiptNumber,
          completedAt: new Date(),
        },
      })

      return {
        success: true,
        transaction: completed,
        message: 'Withdrawal completed successfully',
      }
    } else {
      // Refund wallet
      const user = transaction.user
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          walletBalance: user.walletBalance.plus(transaction.amount),
          totalWithdrawn: user.totalWithdrawn.minus(transaction.amount),
        },
      })

      // Mark as failed
      await WalletService.failTransaction(transaction.id, result.resultDesc)

      return {
        success: false,
        transactionId: transaction.id,
        message: result.resultDesc,
      }
    }
  }

  /**
   * Fund campaign from advertiser wallet
   */
  static async fundCampaign(
    advertiserId: string,
    campaignId: string,
    amount: number
  ): Promise<any> {
    const commissionRate = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '15') / 100
    const platformFee = amount * commissionRate
    const campaignBudget = amount - platformFee

    const reference = MpesaService.generateReference('FND')

    // Transfer from advertiser to campaign (using wallet debit)
    await WalletService.debit({
      userId: advertiserId,
      amount: amount as unknown as Prisma.Decimal,
      type: 'CAMPAIGN_FUND',
      reference,
      description: `Campaign funding: ${campaignId}`,
      campaignId,
      method: 'WALLET',
    })

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalBudget: campaignBudget as unknown as Prisma.Decimal,
        remainingBudget: campaignBudget as unknown as Prisma.Decimal,
        platformFee: platformFee as unknown as Prisma.Decimal,
        status: 'PENDING_APPROVAL',
      },
    })

    return {
      campaign,
      funded: amount,
      platformFee,
      campaignBudget,
      message: 'Campaign funded successfully. Awaiting approval.',
    }
  }
}
