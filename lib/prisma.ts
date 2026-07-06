import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
  prismaAdapter?: PrismaPg;
};

const pool =
  globalForPrisma.pgPool ||
  new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 4, // limit connections
    idleTimeoutMillis: 1000, // close idle connections quickly to prevent staleness
    connectionTimeoutMillis: 5000,
  });

const adapter =
  globalForPrisma.prismaAdapter ||
  new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prisma = prisma;
}

export default prisma;
