import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError, NotFoundError, ConflictError } from "@/lib/api-error";
import { createNotification } from "@/lib/notifications";
import { checkAndAwardBadges } from "@/lib/trust-score";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as string;
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(role)) throw new AuthorizationError();

  const { creatorId } = z.object({ creatorId: z.string().cuid() }).parse(await req.json());

  const creator = await prisma.user.findUnique({ where: { id: creatorId, role: "CREATOR" } });
  if (!creator) throw new NotFoundError("Creator");
  if (creator.isElite) throw new ConflictError("Creator is already an Elite 100 member");

  const eliteCount = await prisma.user.count({ where: { isElite: true } });
  if (eliteCount >= 100) throw new ConflictError("Elite 100 is already full");

  await prisma.user.update({
    where: { id: creatorId },
    data: {
      isElite: true,
      eliteJoinedAt: new Date(),
    },
  });

  await createNotification({
    userId: creator.id,
    type: "ELITE_PROMOTED",
    title: "Welcome to Elite 100!",
    message: "You've been invited to join Elite 100 — Kenya's elite creator collective.",
  });

  await checkAndAwardBadges(creatorId);

  return Response.json({ message: "Creator invited to Elite 100" });
});
