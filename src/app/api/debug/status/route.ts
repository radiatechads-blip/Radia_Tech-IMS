export const runtime = "nodejs";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const getJwtSecretName = () => {
  if (process.env.JWT_SECRET) return "JWT_SECRET";
  if (process.env.NEXTAUTH_SECRET) return "NEXTAUTH_SECRET";
  if (process.env.AUTH_SECRET) return "AUTH_SECRET";
  return null;
};

export async function GET() {
  const jwtSecretName = getJwtSecretName();
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const result: Record<string, unknown> = {
    nodeEnv: process.env.NODE_ENV || null,
    vercel: process.env.VERCEL === "1",
    jwtSecretConfigured: Boolean(jwtSecretName),
    jwtSecretName,
    databaseUrlConfigured: Boolean(databaseUrl),
    databaseUrlPresent: databaseUrl ? true : false,
    databaseUrlScheme: databaseUrl ? databaseUrl.split(":")[0] : null,
    directUrlConfigured: Boolean(process.env.DIRECT_URL),
    databaseUrl: databaseUrl ? "present" : "missing",
  };

  try {
    const queryResult = await prisma.$queryRaw`SELECT 1 as result`;
    result.prismaConnected = true;
    result.prismaResult = queryResult;
  } catch (error) {
    result.prismaConnected = false;
    result.prismaError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(result);
}
