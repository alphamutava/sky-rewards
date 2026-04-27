import { prisma } from "@/lib/prisma";
import { validateMpesaCallback } from "@/lib/mpesa/callback-validator";
import { createNotification } from "@/lib/notifications";
import { WalletService } from "@/services/wallet.service";

export async function POST(request: Request) {
  const validation = validateMpesaCallback(request);
  if (!validation.valid) {
    console.error(`[M-Pesa Callback] Rejected: ${validation.reason} from IP ${validation.ipAddress}`);
    return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  try {
    const body = await request.json();
    const { Body: { stkCallback } } = body;

    const callbackMeta = stkCallback.CallbackMetadata?.Item || [];
    const getMetaValue = (name: string) =>
      callbackMeta.find((i: { Name: string; Value: string | number }) => i.Name === name)?.Value;

    // Log callback in audit log
    await prisma.auditLog.create({
      data: {
        action: "mpesa.stk_callback",
        entity: "transaction",
        entityId: stkCallback.CheckoutRequestID || "unknown",
        newValue: body,
        ipAddress: validation.ipAddress,
      },
    });

    // Find the transaction by checkpoint request ID (stored as mpesaRequestId during deposit)
    const txToProcess = await prisma.transaction.findFirst({
      where: {
        status: "PENDING",
        type: "DEPOSIT",
        method: "MPESA_STK",
        mpesaRequestId: stkCallback.CheckoutRequestID,
      },
    });

    if (stkCallback.ResultCode === 0 && txToProcess) {
      const receiptNo = getMetaValue("MpesaReceiptNumber")?.toString();

      await WalletService.completeTransaction(txToProcess.id, receiptNo, {
        mpesaCallback: {
          resultCode: stkCallback.ResultCode,
          resultDesc: stkCallback.ResultDesc,
          receiptNumber: receiptNo,
        },
      });

      await createNotification({
        userId: txToProcess.userId,
        type: "PAYMENT_RECEIVED",
        title: "Deposit Successful",
        message: `KES ${Number(txToProcess.amount).toLocaleString()} has been added to your wallet via M-Pesa.`,
      });
    } else if (txToProcess) {
      await WalletService.failTransaction(txToProcess.id, stkCallback.ResultDesc);

      await createNotification({
        userId: txToProcess.userId,
        type: "SYSTEM",
        title: "Deposit Failed",
        message: `Your M-Pesa deposit of KES ${Number(txToProcess.amount).toLocaleString()} failed: ${stkCallback.ResultDesc}`,
      });
    }
  } catch (error) {
    console.error("[M-Pesa STK Callback] Processing error:", error);
  }

  return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
