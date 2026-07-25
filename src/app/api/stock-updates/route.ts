import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Stock update endpoint ready." });
}

export async function POST() {
  return NextResponse.json({ ok: true, message: "Stock update endpoint ready." }, { status: 201 });
}
