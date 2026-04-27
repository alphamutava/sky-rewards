import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  withErrorHandler,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  InsufficientFundsError,
} from "@/lib/api-error";
import { withdrawSchema } from "@/validators/wallet";
import { mpesaClient } from "@/lib/mpesa/client";
import { checkRateLimit, withdrawalLimiter } from "@/lib/rate-limiter";
import { generateReference } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  const rateCheck = await checkRateLimit(withdrawalLimiter, `withdraw:${session.user.id}`);
  if (!rateCheck.allowed) {
    throw new ValidationError("Too many withdrawal attempts. Please wait.");
  }

  const body = await req.json();
  const result = withdrawSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
  }

  const { amount, phoneNumber } = result.data;

  const reference = generateReference();
  const conversationId = `SKY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Deduct from wallet and create transaction atomically (balance check inside tx to prevent race)
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true },
    });
    if (!user) throw new NotFoundError("User");
    if (Number(user.walletBalance) < amount) throw new InsufficientFundsError();

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        walletBalance: { decrement: amount },
        totalWithdrawn: { increment: amount },
      },
    });

    await tx.transaction.create({
      data: {
        userId: session.user.id,
        type: "WITHDRAWAL",
        status: "PROCESSING",
        method: "MPESA_B2C",
        amount,
        fee: 0,
        netAmount: amount,
        referenceCode: reference,
        mpesaRequestId: conversationId,
        transactionDesc: `M-Pesa withdrawal of KES ${amount.toLocaleString()} to ${phoneNumber}`,
        phoneNumber,
        metadata: { conversationId },
      },
    });
  });

  // Initiate B2C payment
  try {
    await mpesaClient.b2cPayment({
      phoneNumber,
      amount,
      remarks: `Sky Kenya Payout - ${reference}`,
      occasion: reference,
      conversationId,
    });
  } catch {
    // If B2C fails, refund the wallet
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { walletBalance: { increment: amount } },
      });
      await tx.transaction.updateMany({
        where: { referenceCode: reference },
        data: { status: "FAILED", failureReason: "B2C initiation failed" },
      });
    });
    throw new ValidationError("Withdrawal failed. Your funds have been returned.");
  }

  await createNotification({
    userId: session.user.id,
    type: "PAYOUT_SENT",
    title: "Withdrawal Processing",
    message: `KES ${amount.toLocaleString()} is being sent to ${phoneNumber} via M-Pesa.`,
  });

  return Response.json({
    success: true,
    data: {
      message: "Withdrawal initiated. You will receive the money on your M-Pesa shortly.",
      reference,
    },
  });
});
