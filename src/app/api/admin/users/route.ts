import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, AuthorizationError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as string;
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) throw new AuthorizationError();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "20"), 50);
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, phone: true, role: true, status: true, phoneVerified: true,
        firstName: true, lastName: true, displayName: true,
        eliteScore: true, totalEarned: true, totalViews: true, totalSubmissions: true, totalApproved: true,
        isElite: true, eliteRank: true,
        lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return Response.json({ data: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});
