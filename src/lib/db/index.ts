import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// In dev, clear stale cached client when schema changes (e.g. after prisma generate)
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
  const cached = globalForPrisma.prisma as unknown as Record<string, unknown>;
  if (!cached.invite) {
    globalForPrisma.prisma = undefined;
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
