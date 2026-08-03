export const runtime = "nodejs";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch {
    // Fallback to JWT data if DB is unavailable
    return NextResponse.json({ authenticated: true, user: { id: session.id, email: session.email, name: null } });
  }
}
