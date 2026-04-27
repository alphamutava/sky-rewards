import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { encryptString, decryptString } from "./encryption";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

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
          if (['create', 'update', 'upsert', 'createMany'].includes(operation)) {
            const data = (args as { data?: any }).data;
            if (data) {
              if (data.phone && typeof data.phone === 'string') data.phone = encryptString(data.phone);
              if (data.email && typeof data.email === 'string') data.email = encryptString(data.email);
              if (data.nationalId && typeof data.nationalId === 'string') data.nationalId = encryptString(data.nationalId);
            }
          }
          // Encrypt searchable queries
          if (['findUnique', 'findFirst', 'findMany', 'update', 'delete'].includes(operation)) {
            const where = (args as { where?: any }).where;
            if (where) {
              if (where.phone && typeof where.phone === 'string') where.phone = encryptString(where.phone);
              if (where.email && typeof where.email === 'string') where.email = encryptString(where.email);
              if (where.nationalId && typeof where.nationalId === 'string') where.nationalId = encryptString(where.nationalId);
            }
          }
          return query(args);
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
