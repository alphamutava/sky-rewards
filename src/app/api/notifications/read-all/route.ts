import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthenticationError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });

  return Response.json({ message: "All notifications marked as read" });
});
