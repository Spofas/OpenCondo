import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { softDeleteExtension } from "./soft-delete-extension";

type ExtendedClient = ReturnType<typeof createExtendedClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedClient | undefined;
};

function createExtendedClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter }).$extends(softDeleteExtension);
}

function getClient(): ExtendedClient {
  // In dev, clear stale cached client when schema changes (e.g. after prisma generate)
  if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
    const cached = globalForPrisma.prisma as unknown as Record<string, unknown>;
    if (!cached.invite) {
      globalForPrisma.prisma = undefined;
    }
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createExtendedClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: the client is only created on the first actual db call (at request
// time), not at module import time. This lets Next.js import the module during
// the build step without requiring DATABASE_URL to be present at build time.
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop as string];
  },
});
