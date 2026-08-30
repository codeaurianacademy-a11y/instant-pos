import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  adapter?: PrismaPg;
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const adapter = globalForPrisma.adapter ?? new PrismaPg({ connectionString: process.env.DATABASE_URL });
  globalForPrisma.adapter = adapter;

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
