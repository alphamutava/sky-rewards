import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthenticationError, NotFoundError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      walletBalance: true,
      totalEarned: true,
      totalWithdrawn: true,
    },
  });

  if (!user) throw new NotFoundError("User");

  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return Response.json({
    success: true,
    data: {
      wallet: {
        balance: user.walletBalance,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn,
        currency: "KES",
      },
      recentTransactions,
    },
  });
});
