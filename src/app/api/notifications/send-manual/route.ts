import { requireAuth } from "@/lib/auth";
import { sendInvoiceReminderEmail } from "@/lib/invoiceEmails";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const invoiceId = body?.invoiceId;
  const type = body?.type || "due";
  if (!invoiceId) return NextResponse.json({ ok: false, error: "invoiceId is required" }, { status: 400 });

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });

    const result = await sendInvoiceReminderEmail(invoice as any, type);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
