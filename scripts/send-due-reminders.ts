#!/usr/bin/env ts-node
import { addDays, endOfDay, startOfDay } from 'date-fns';
import { findInvoicesByDueDate, sendInvoiceReminderEmail } from '../src/lib/invoiceEmails';

async function runOffset(offset: number, type: 'before3' | 'due' | 'after3' | 'after7') {
  const target = addDays(new Date(), offset);
  const start = startOfDay(target);
  const end = endOfDay(target);
  const invoices = await findInvoicesByDueDate(start, end);
  console.log(`Found ${invoices.length} invoices for ${type} (offset ${offset})`);
  for (const inv of invoices) {
    const res = await sendInvoiceReminderEmail(inv, type);
    console.log(inv.invoiceNumber, inv.email, res.ok ? 'sent' : `error:${res.error}`);
    await new Promise((r) => setTimeout(r, 400));
  }
}

(async function main() {
  try {
    await runOffset(3, 'before3');
    await runOffset(0, 'due');
    await runOffset(-3, 'after3');
    await runOffset(-7, 'after7');
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error running reminders', err);
    process.exit(1);
  }
})();
