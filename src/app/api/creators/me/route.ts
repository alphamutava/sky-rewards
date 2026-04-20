import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateCreatorSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
  county: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  avatar: z.string().url().optional(),
});

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();
  if (session.user.role !== "CREATOR") throw new AuthorizationError();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, phone: true, email: true, role: true, status: true,
      firstName: true, lastName: true, displayName: true,
      bio: true, avatar: true, county: true, city: true,
      walletBalance: true, totalEarned: true, totalWithdrawn: true,
      isElite: true, eliteRank: true, eliteScore: true,
      totalViews: true, totalSubmissions: true, totalApproved: true,
      averageRating: true, createdAt: true,
    },
  });

  if (!user) throw new NotFoundError("User");

  return Response.json({ success: true, data: user });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();
  if (session.user.role !== "CREATOR") throw new AuthorizationError();

  const body = await req.json();
  const result = updateCreatorSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: result.data,
  });

  return Response.json({ success: true, data: user });
});
