import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withErrorHandler, AuthenticationError, ValidationError } from "@/lib/api-error";
import { WalletService } from "@/services/wallet.service";
import { depositSchema } from "@/validators/wallet";
import { mpesaClient } from "@/lib/mpesa/client";
import { checkRateLimit, depositLimiter } from "@/lib/rate-limiter";
import { generateReference } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  // Check M-Pesa env vars early
  const requiredEnvVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_SHORTCODE',
    'MPESA_PASSKEY',
    'MPESA_CALLBACK_BASE_URL'
  ];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing M-Pesa env vars: ${missing.join(', ')}`);
  }

  const rateCheck = await checkRateLimit(depositLimiter, `deposit:${session.user.id}`);
  if (!rateCheck.allowed) {
    throw new ValidationError("Too many deposit attempts. Please wait a few minutes.");
  }

  const body = await req.json();
  const result = depositSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
  }

  const { amount, phoneNumber } = result.data;
  const reference = generateReference();

  // Initiate M-Pesa STK Push
  let stkResponse;
  try {
    stkResponse = await mpesaClient.stkPush({
      phoneNumber,
      amount,
      accountReference: reference,
      transactionDesc: `Sky Kenya Deposit - ${reference}`,
    });
  } catch (error: any) {
    console.error('STK Push error:', error.message);
    throw new Error(`M-Pesa STK Push failed: ${error.message}`);
  }

  // Create pending transaction via service
  await WalletService.createPendingTransaction({
    userId: session.user.id,
    type: "DEPOSIT",
    amount,
    reference,
    description: `M-Pesa deposit of KES ${amount.toLocaleString()}`,
    method: "MPESA_STK",
    phoneNumber,
    accountReference: reference,
    metadata: { checkoutRequestId: stkResponse.CheckoutRequestID },
  });

  return Response.json({
    success: true,
    data: {
      message: "STK Push sent to your phone. Please enter your M-Pesa PIN.",
      checkoutRequestId: stkResponse.CheckoutRequestID,
      reference,
    },
  });
});
