import { requireAuth } from "@/lib/auth";
import { sendPaymentReceivedEmail } from "@/lib/invoiceEmails";
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
  const amount = Number(body?.amount ?? 0);
  const paymentMode = String(body?.paymentMode || "Cash").trim();
  const note = String(body?.note || "").trim();
  if (!invoiceId) return NextResponse.json({ ok: false, error: "invoiceId is required" }, { status: 400 });
  if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: "Valid amount is required" }, { status: 400 });

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice) return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });

    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = invoice.grandTotal - totalPaid;
    if (amount > remaining) {
      return NextResponse.json({ ok: false, error: "Amount exceeds remaining balance" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        paymentMode,
        note,
      },
    });

    const remainingAfterPayment = invoice.grandTotal - (totalPaid + amount);
    await sendPaymentReceivedEmail({
      id: invoice.id,
      email: invoice.email,
      invoiceNumber: invoice.invoiceNumber,
      partyName: invoice.partyName,
      grandTotal: invoice.grandTotal,
      remainingAmount: remainingAfterPayment,
      paidAmount: totalPaid + amount,
      amountReceived: amount,
      paymentMode,
      dueDate: invoice.dueDate,
    });

    return NextResponse.json({ ok: true, payment });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
