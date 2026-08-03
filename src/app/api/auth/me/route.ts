import { logServerError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
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
    } catch (error) {
      logServerError("api.auth.me.GET", error);
      return NextResponse.json({ authenticated: true, user: { id: session.id, email: session.email, name: null } });
    }
  } catch (error) {
    logServerError("api.auth.me.GET", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
