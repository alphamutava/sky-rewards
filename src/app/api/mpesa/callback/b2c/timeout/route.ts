import { prisma } from "@/lib/prisma";
import { validateMpesaCallback } from "@/lib/mpesa/callback-validator";

export async function POST(request: Request) {
  const validation = validateMpesaCallback(request);
  if (!validation.valid) {
    return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  try {
    const body = await request.json();

    // Log timeout callback
    await prisma.auditLog.create({
      data: {
        action: "mpesa.b2c_timeout",
        entity: "transaction",
        entityId: body.Result?.OriginatorConversationID || "unknown",
        newValue: body,
        ipAddress: validation.ipAddress,
      },
    });

    // Mark transaction as failed and refund
    if (body.Result?.OriginatorConversationID) {
      const pendingTx = await prisma.transaction.findFirst({
        where: {
          status: "PROCESSING",
          type: "WITHDRAWAL",
          method: "MPESA_B2C",
          mpesaRequestId: body.Result.OriginatorConversationID,
        },
      });

      if (pendingTx) {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: pendingTx.userId },
            data: { walletBalance: { increment: pendingTx.amount } },
          });

          await tx.transaction.update({
            where: { id: pendingTx.id },
            data: {
              status: "FAILED",
              failureReason: "M-Pesa request timed out",
            },
          });
        });
      }
    }
  } catch (error) {
    console.error("[B2C Timeout Callback] Error:", error);
  }

  return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
