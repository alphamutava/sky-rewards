import { prisma } from '@/lib/prisma'
import { MpesaService } from '@/lib/mpesa'
import { WalletService } from '@/services/wallet.service'
import { NotificationService } from '@/services/notification.service'

/**
 * Process pending withdrawal requests via M-Pesa B2C
 */
export async function processPayouts(): Promise<void> {
  const pendingPayouts = await prisma.transaction.findMany({
    where: {
      type: 'WITHDRAWAL',
      status: 'PENDING',
    },
    include: {
      user: true,
    },
    take: 10, // Process max 10 at a time
  })

  if (pendingPayouts.length === 0) {
    return
  }

  console.log(`[ProcessPayouts] Processing ${pendingPayouts.length} pending payouts`)

  for (const transaction of pendingPayouts) {
    try {
      // Mark as processing
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PROCESSING' },
      })

      const callbackUrl = `${process.env.MPESA_B2C_CALLBACK_URL}/api/payments/mpesa/b2c-callback`
      const timeoutUrl = process.env.MPESA_B2C_TIMEOUT_URL || callbackUrl

      // Initiate B2C
      const response = await MpesaService.b2cPayment({
        phone: transaction.phoneNumber || transaction.user.phone,
        amount: transaction.amount.toNumber(),
        remarks: 'Sky Kenya Withdrawal',
        occasion: 'Payout',
        callbackUrl,
        timeoutUrl,
      })

      // Update with conversation ID
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          mpesaRequestId: response.ConversationID,
          status: 'PROCESSING',
          metadata: {
            ...transaction.metadata,
            originatorConversationId: response.OriginatorConversationID,
          },
        },
      })

      console.log(`[ProcessPayouts] Initiated payout ${transaction.id}, ConversationID: ${response.ConversationID}`)
    } catch (error: any) {
      console.error(`[ProcessPayouts] Failed to process payout ${transaction.id}:`, error.message)

      // Refund the wallet
      await prisma.$transaction(async (tx) => {
        // Get current balance
        const user = await tx.user.findUnique({
          where: { id: transaction.userId },
          select: { walletBalance: true, totalWithdrawn: true },
        })

        if (user) {
          // Refund
          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              walletBalance: user.walletBalance.plus(transaction.amount),
              totalWithdrawn: user.totalWithdrawn.minus(transaction.amount),
            },
          })
        }

        // Mark as failed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            failureReason: error.message,
          },
        })
      })

      // Notify user
      await NotificationService.create({
        userId: transaction.userId,
        type: 'SYSTEM',
        title: 'Withdrawal Failed',
        message: `Your withdrawal of KES ${transaction.amount} could not be processed. The amount has been refunded to your wallet.`,
      })
    }
  }
}
