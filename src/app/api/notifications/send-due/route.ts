import { findInvoicesByDueDate, sendInvoiceReminderEmail } from '@/lib/invoiceEmails';
import { addDays, endOfDay, startOfDay } from 'date-fns';
import { NextResponse } from 'next/server';

async function runForOffset(offsetDays: number, type: 'before3' | 'due' | 'after3' | 'after7') {
  const target = addDays(new Date(), offsetDays);
  const start = startOfDay(target);
  const end = endOfDay(target);
  const invoices = await findInvoicesByDueDate(start, end);

  const results: any[] = [];
  for (const inv of invoices) {
    const res = await sendInvoiceReminderEmail(inv, type);
    results.push({ invoice: inv.invoiceNumber, email: inv.email, ok: res.ok, error: res.error });
    // slight delay to avoid provider rate limits
    await new Promise((r) => setTimeout(r, 300));
  }
  return { count: invoices.length, results };
}

export async function GET(request: Request) {
  const secret = process.env.REMINDERS_API_KEY || '';
  if (secret) {
    const incoming = request.headers.get('x-reminder-key') || request.headers.get('authorization') || '';
    if (!incoming || incoming !== secret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }
  try {
    // 3 days before due date: offset +3
    const before3 = await runForOffset(3, 'before3');
    // on due date: offset 0
    const due = await runForOffset(0, 'due');
    // 3 days after: offset -3
    const after3 = await runForOffset(-3, 'after3');
    // 7 days after: offset -7
    const after7 = await runForOffset(-7, 'after7');

    return NextResponse.json({ ok: true, before3, due, after3, after7 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
