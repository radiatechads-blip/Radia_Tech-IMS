import { requireAuth } from "@/lib/auth";
import { sendInvoiceReminderEmail } from "@/lib/invoiceEmails";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const invoiceId = body?.invoiceId;
  const type = body?.type || "due";
  if (!invoiceId) return NextResponse.json({ ok: false, error: "invoiceId is required" }, { status: 400 });

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });

    const result = await sendInvoiceReminderEmail(invoice as Parameters<typeof sendInvoiceReminderEmail>[0], type as Parameters<typeof sendInvoiceReminderEmail>[1]);
    if (!result?.ok) {
      return NextResponse.json({ ok: false, error: result?.error || "Failed to send reminder" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
