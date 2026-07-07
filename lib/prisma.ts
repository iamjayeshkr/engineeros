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
    // `output: "standalone"` means this runs as a long-lived Node server, not
    // per-request serverless functions — so the pool should stay warm across
    // requests rather than be torn down between them. The previous
    // idleTimeoutMillis of 1s meant almost every request paid a fresh
    // TCP+TLS+auth handshake to Postgres/pgbouncer, which alone can blow past
    // a 100ms route budget before any query even runs.
    max: 10,
    idleTimeoutMillis: 60_000, // keep connections warm between requests
    connectionTimeoutMillis: 5000,
    maxUses: 7500, // recycle connections periodically to avoid staleness, not every 1s
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
