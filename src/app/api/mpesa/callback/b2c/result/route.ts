import { prisma } from "@/lib/prisma";
import { validateMpesaCallback } from "@/lib/mpesa/callback-validator";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const validation = validateMpesaCallback(request);
  if (!validation.valid) {
    console.error(`[B2C Callback] Rejected: ${validation.reason}`);
    return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  try {
    const body = await request.json();
    const { Result } = body;

    const params = Result.ResultParameters?.ResultParameter || [];
    const getParam = (key: string) =>
      params.find((p: { Key: string; Value: string | number }) => p.Key === key)?.Value;

    // Log callback in audit log
    await prisma.auditLog.create({
      data: {
        action: "mpesa.b2c_result",
        entity: "transaction",
        entityId: Result.OriginatorConversationID || "unknown",
        newValue: body,
        ipAddress: validation.ipAddress,
      },
    });

    // Find processing withdrawal by conversationId in metadata
    const processingTxs = await prisma.transaction.findMany({
      where: { status: "PROCESSING", type: "WITHDRAWAL", method: "MPESA_B2C" },
    });
    const pendingTx = processingTxs.find((tx) => {
      const meta = tx.metadata as any;
      return meta?.conversationId === Result.OriginatorConversationID;
    });

    if (!pendingTx) {
      return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (Result.ResultCode === 0) {
      const receiptNo = getParam("TransactionReceipt")?.toString();
      await prisma.transaction.update({
        where: { id: pendingTx.id },
        data: {
          status: "COMPLETED",
          mpesaReceiptNo: receiptNo,
          completedAt: new Date(),
          metadata: {
            ...(pendingTx.metadata as any),
            b2cResult: { resultCode: Result.ResultCode, resultDesc: Result.ResultDesc },
          },
        },
      });

      await createNotification({
        userId: pendingTx.userId,
        type: "PAYOUT_SENT",
        title: "Withdrawal Successful",
        message: `KES ${Number(pendingTx.amount).toLocaleString()} has been sent to your M-Pesa.`,
      });
    } else {
      // Refund the user's wallet and fail the transaction
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: pendingTx.userId },
          data: { walletBalance: { increment: pendingTx.amount } },
        });

        await tx.transaction.update({
          where: { id: pendingTx.id },
          data: {
            status: "FAILED",
            failureReason: Result.ResultDesc,
          },
        });
      });

      await createNotification({
        userId: pendingTx.userId,
        type: "SYSTEM",
        title: "Withdrawal Failed",
        message: `Your withdrawal of KES ${Number(pendingTx.amount).toLocaleString()} failed. Funds have been returned to your wallet.`,
      });
    }
  } catch (error) {
    console.error("[B2C Result Callback] Error:", error);
  }

  return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
