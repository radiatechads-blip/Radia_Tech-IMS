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
    // Try to include reminders relation; if the InvoiceReminder table doesn't
    // exist yet in the DB, fall back to returning invoices without reminders
    // so the admin UI remains available while migrations are applied.
    try {
      const invoices = await prisma.invoice.findMany({
        where: { email: { not: "" } },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          partyName: true,
          grandTotal: true,
          dueDate: true,
          email: true,
          reminders: { select: { id: true, type: true, sentAt: true, meta: true }, orderBy: { sentAt: "desc" } },
        },
      });

      return NextResponse.json({ ok: true, invoices });
    } catch (innerErr: any) {
      const msg = String(innerErr?.message || innerErr || "").toLowerCase();
      if (msg.includes("invoicereminder") || msg.includes("invoice_reminder") || msg.includes("invoiceReminder") || msg.includes("relation \"invoicereminder\" does not exist")) {
        // Fallback: fetch invoices without the reminders relation
        const invoices = await prisma.invoice.findMany({
          where: { email: { not: "" } },
          orderBy: { dueDate: "asc" },
          select: { id: true, invoiceNumber: true, partyName: true, grandTotal: true, dueDate: true, email: true },
        });

        // Attach empty reminders arrays so the UI can render consistently
        const withEmpty = invoices.map((inv) => ({ ...inv, reminders: [] }));
        return NextResponse.json({ ok: true, invoices: withEmpty });
      }

      throw innerErr;
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
