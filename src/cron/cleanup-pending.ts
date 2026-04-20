import { prisma } from '@/lib/prisma'
import { MpesaService } from '@/lib/mpesa'
import { NotificationService } from '@/services/notification.service'

/**
 * Cleanup stale pending transactions (> 24 hours)
 */
export async function cleanupPendingTransactions(): Promise<void> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Find stale pending transactions
  const staleTransactions = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: twentyFourHoursAgo },
    },
    include: {
      user: true,
    },
  })

  if (staleTransactions.length === 0) {
    return
  }

  console.log(`[Cleanup] Found ${staleTransactions.length} stale pending transactions`)

  for (const transaction of staleTransactions) {
    try {
      // For STK Push deposits, query the status
      if (transaction.type === 'DEPOSIT' && transaction.mpesaRequestId) {
        try {
          const status = await MpesaService.querySTKStatus(transaction.mpesaRequestId)

          // If we got a result, the transaction was processed
          if (status.ResultCode !== undefined) {
            if (status.ResultCode === 0) {
              // Success - complete the transaction
              await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                  status: 'COMPLETED',
                  mpesaReceiptNo: status.CallbackMetadata?.Item?.find(
                    (i: any) => i.Name === 'MpesaReceiptNumber'
                  )?.Value,
                  completedAt: new Date(),
                },
              })

              // Credit wallet
              await prisma.user.update({
                where: { id: transaction.userId },
                data: {
                  walletBalance: transaction.user.walletBalance.plus(transaction.amount),
                },
              })

              console.log(`[Cleanup] Completed stale transaction ${transaction.id}`)
              continue
            } else {
              // Failed
              await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                  status: 'FAILED',
                  failureReason: status.ResultDesc,
                },
              })

              console.log(`[Cleanup] Marked failed transaction ${transaction.id}`)
              continue
            }
          }
        } catch (error) {
          console.error(`[Cleanup] Error querying STK status for ${transaction.id}:`, error)
        }
      }

      // For withdrawals or failed queries, cancel after extended time (> 48 hours)
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      if (transaction.createdAt < fortyEightHoursAgo) {
        // For withdrawals, refund the wallet
        if (transaction.type === 'WITHDRAWAL') {
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
              where: { id: transaction.userId },
              select: { walletBalance: true, totalWithdrawn: true },
            })

            if (user) {
              await tx.user.update({
                where: { id: transaction.userId },
                data: {
                  walletBalance: user.walletBalance.plus(transaction.amount),
                  totalWithdrawn: user.totalWithdrawn.minus(transaction.amount),
                },
              })
            }

            await tx.transaction.update({
              where: { id: transaction.id },
              data: {
                status: 'CANCELLED',
                failureReason: 'Transaction timed out after 48 hours',
              },
            })
          })

          await NotificationService.create({
            userId: transaction.userId,
            type: 'SYSTEM',
            title: 'Withdrawal Cancelled',
            message: `Your withdrawal of KES ${transaction.amount} was cancelled due to timeout. The amount has been refunded to your wallet.`,
          })
        } else {
          // For deposits, just mark as cancelled
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'CANCELLED',
              failureReason: 'Transaction timed out after 48 hours',
            },
          })
        }

        console.log(`[Cleanup] Cancelled stale transaction ${transaction.id}`)
      }
    } catch (error) {
      console.error(`[Cleanup] Error processing transaction ${transaction.id}:`, error)
    }
  }
}
