import { NextResponse } from "next/server";
import { isDatabaseConfigured, getDatabaseUrl } from "@/lib/mock-data";

export async function GET() {
  const isDbReady = isDatabaseConfigured();
  return NextResponse.json({
    status: "ok",
    isDatabaseConfigured: isDbReady,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPostgresPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasDatabaseUrlUnpooled: Boolean(process.env.DATABASE_URL_UNPOOLED),
    databaseType: isDbReady ? "PostgreSQL (Cloud Database)" : "Demo In-Memory Mode",
    version: "1.5.1",
  });
}
