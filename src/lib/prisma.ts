import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@libsql/client";
import { Pool } from "pg";
import { encryptString, decryptString } from "./encryption";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || "file:./dev.db";
  let adapter: any;

  if (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://")) {
    const pool = new Pool({ connectionString });
    adapter = new PrismaPg(pool);
  } else {
    const libsql = createClient({ url: connectionString });
    adapter = new PrismaLibSql(libsql);
  }

  const baseClient = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  return baseClient.$extends({
    result: {
      user: {
        phone: {
          needs: { phone: true },
          compute(user) {
            return user.phone ? decryptString(user.phone) : null;
          },
        },
        email: {
          needs: { email: true },
          compute(user) {
            return user.email ? decryptString(user.email) : null;
          },
        },
        nationalId: {
          needs: { nationalId: true },
          compute(user) {
            return user.nationalId ? decryptString(user.nationalId) : null;
          },
        },
      },
    },
    query: {
      user: {
        async $allOperations({ operation, args, query }) {
          // Encrypt outgoing data
          if (['create', 'update', 'upsert', 'createMany'].includes(operation) && args.data) {
            const data: any = args.data;
            if (data.phone && typeof data.phone === 'string') data.phone = encryptString(data.phone);
            if (data.email && typeof data.email === 'string') data.email = encryptString(data.email);
            if (data.nationalId && typeof data.nationalId === 'string') data.nationalId = encryptString(data.nationalId);
          }
          // Encrypt searchable queries
          if (['findUnique', 'findFirst', 'findMany', 'update', 'delete'].includes(operation) && args.where) {
            const where: any = args.where;
            if (where.phone && typeof where.phone === 'string') where.phone = encryptString(where.phone);
            if (where.email && typeof where.email === 'string') where.email = encryptString(where.email);
            if (where.nationalId && typeof where.nationalId === 'string') where.nationalId = encryptString(where.nationalId);
          }
          return query(args);
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
