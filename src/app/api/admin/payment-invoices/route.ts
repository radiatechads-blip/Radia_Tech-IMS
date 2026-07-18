import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAuth();
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { email: { not: "" } },
      orderBy: { dueDate: "asc" },
      include: { payments: true },
    });

    const payload = invoices.map((invoice) => {
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        partyName: invoice.partyName,
        email: invoice.email,
        grandTotal: invoice.grandTotal,
        invoiceDate: invoice.invoiceDate?.toISOString() ?? null,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        paymentMode: invoice.paymentMode,
        notes: invoice.notes,
        totalPaid,
        remaining: Number((invoice.grandTotal - totalPaid).toFixed(2)),
        payments: invoice.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          paymentMode: payment.paymentMode,
          note: payment.note,
          paidAt: payment.paidAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ ok: true, invoices: payload });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
