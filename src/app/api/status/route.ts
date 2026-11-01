import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/mock-data";

export async function GET() {
  const isDbReady = isDatabaseConfigured();
  return NextResponse.json({
    status: "ok",
    isDatabaseConfigured: isDbReady,
    databaseType: isDbReady ? "PostgreSQL (Cloud Database)" : "Demo In-Memory Mode",
    version: "1.3.2",
  });
}
