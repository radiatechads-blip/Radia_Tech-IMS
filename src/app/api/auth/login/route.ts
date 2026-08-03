export const runtime = "nodejs";

import { jsonError, logServerError } from "@/lib/api";
import { signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(req);
    const ipLimit = checkRateLimit({ key: `admin-login:ip:${clientIdentifier}`, limit: 10, windowMs: 15 * 60 * 1000 });

    if (!ipLimit.allowed) {
      return jsonError("Too many login attempts. Please try again later.", 429, { "Retry-After": String(ipLimit.retryAfter) });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ id: user.id, email: user.email });

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    logServerError("api.auth.login", error);
    return jsonError("Internal server error", 500);
  }
}
