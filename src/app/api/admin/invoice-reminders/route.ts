import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type ReminderStatus = "paid" | "unpaid";

type InvoiceReminderRow = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  invoiceDate: Date | null;
  dueDate: Date | null;
  email: string;
  remindersPaused: boolean;
};

function isReminderStatus(value: unknown): value is ReminderStatus {
  return value === "paid" || value === "unpaid";
}

async function ensureRemindersPausedColumn() {
  try {
    await prisma.$executeRaw`
      ALTER TABLE "Invoice"
      ADD COLUMN IF NOT EXISTS "remindersPaused" BOOLEAN NOT NULL DEFAULT false
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.toLowerCase().includes("already exists") && !message.toLowerCase().includes("duplicate column")) {
      throw err;
    }
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const invoiceId = typeof body?.invoiceId === "string" ? body.invoiceId : "";
    const status = body?.status;

    if (!invoiceId || !isReminderStatus(status)) {
      return NextResponse.json({ ok: false, error: "invoiceId and status are required" }, { status: 400 });
    }

    await ensureRemindersPausedColumn();
    await prisma.$executeRaw`
      UPDATE "Invoice"
      SET "remindersPaused" = ${status === "paid"}
      WHERE "id" = ${invoiceId}
    `;

    const [invoice] = await prisma.$queryRaw<InvoiceReminderRow[]>`
      SELECT "id", "invoiceNumber", "partyName", "grandTotal", "invoiceDate", "dueDate", "email", "remindersPaused"
      FROM "Invoice"
      WHERE "id" = ${invoiceId}
    `;

    return NextResponse.json({ ok: true, invoice: invoice ?? null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Try to include reminders relation; if the InvoiceReminder table doesn't
    // exist yet in the DB, fall back to returning invoices without reminders
    // so the admin UI remains available while migrations are applied.
    try {
      await ensureRemindersPausedColumn();
      const invoices = await prisma.invoice.findMany({
        where: { email: { not: "" } },
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          invoiceNumber: true,
          partyName: true,
          grandTotal: true,
          invoiceDate: true,
          dueDate: true,
          email: true,
          reminders: { select: { id: true, type: true, sentAt: true, meta: true }, orderBy: { sentAt: "desc" } },
        },
      });

      const pausedRows = await prisma.$queryRaw<Array<{ id: string; remindersPaused: boolean }>>`
        SELECT "id", "remindersPaused"
        FROM "Invoice"
        WHERE "email" <> ''
      `;
      const pausedMap = new Map(pausedRows.map((row) => [row.id, row.remindersPaused]));
      const withPauseState = invoices.map((invoice) => ({
        ...invoice,
        remindersPaused: pausedMap.get(invoice.id) ?? false,
      }));

      return NextResponse.json({ ok: true, invoices: withPauseState });
    } catch (innerErr: unknown) {
      const msg = String(innerErr instanceof Error ? innerErr.message : innerErr || "").toLowerCase();
      if (msg.includes("invoicereminder") || msg.includes("invoice_reminder") || msg.includes("invoiceReminder") || msg.includes("relation \"invoicereminder\" does not exist")) {
        // Fallback: fetch invoices without the reminders relation
        await ensureRemindersPausedColumn();
        const invoices = await prisma.invoice.findMany({
          where: { email: { not: "" } },
          orderBy: { dueDate: "asc" },
          select: { id: true, invoiceNumber: true, partyName: true, grandTotal: true, invoiceDate: true, dueDate: true, email: true },
        });

        const pausedRows = await prisma.$queryRaw<Array<{ id: string; remindersPaused: boolean }>>`
          SELECT "id", "remindersPaused"
          FROM "Invoice"
          WHERE "email" <> ''
        `;
        const pausedMap = new Map(pausedRows.map((row) => [row.id, row.remindersPaused]));

        // Attach empty reminders arrays so the UI can render consistently
        const withEmpty = invoices.map((inv) => ({ ...inv, reminders: [], remindersPaused: pausedMap.get(inv.id) ?? false }));
        return NextResponse.json({ ok: true, invoices: withEmpty });
      }

      throw innerErr;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
