import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from "@/lib/api-error";
import { z } from "zod";

const updateBrandSchema = z.object({
  displayName: z.string().min(2).optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
});

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();
  const role = session?.user?.role as string;
  if (role !== 'ADVERTISER') throw new AuthorizationError();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, phone: true, role: true, status: true,
      firstName: true, lastName: true, displayName: true,
      bio: true, avatar: true, county: true, city: true,
      createdAt: true,
    },
  });

  if (!user) throw new NotFoundError("User");

  return Response.json({ profile: user });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError();
  const role = session?.user?.role as string;
  if (role !== 'ADVERTISER') throw new AuthorizationError();

  const body = await req.json();
  const result = updateBrandSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: result.data,
  });

  return Response.json({ profile: user });
});
