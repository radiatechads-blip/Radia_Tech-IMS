// import { companyInfo } from '@/data/company';
// import { sendEmail } from './email';
// import { prisma } from './prisma';

// function fmtDate(d?: Date | string | null) {
//   if (!d) return '';
//   const dt = new Date(d);
//   return dt.toLocaleDateString('en-GB');
// }

// function currency(n: number) {
//   return `₹${Number(n || 0).toFixed(2)}`;
// }

// function buildHtml({ heading, intro, invoice }: { heading: string; intro: string; invoice: any }) {
//   return `
//   <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
//     <div style="background:#0B3D91;padding:18px;border-radius:8px 8px 0 0;color:#fff">
//       <h2 style="margin:0">${companyInfo.fullName}</h2>
//       <p style="margin:4px 0 0;opacity:0.85">${companyInfo.tagline}</p>
//     </div>
//     <div style="background:#fff;padding:18px;border:1px solid #e6eef8;border-top:0;border-radius:0 0 8px 8px;color:#111}">
//       <h3 style="margin-top:0;color:#0b3d91">${heading}</h3>
//       <p style="color:#374151">${intro}</p>

//       <table style="width:100%;border-collapse:collapse;margin-top:12px">
//         <tr><td style="font-weight:600;padding:8px 0;width:160px">Invoice</td><td style="padding:8px 0">${invoice.invoiceNumber}</td></tr>
//         <tr><td style="font-weight:600;padding:8px 0">Customer</td><td style="padding:8px 0">${invoice.partyName}</td></tr>
//         <tr><td style="font-weight:600;padding:8px 0">Amount</td><td style="padding:8px 0">${currency(invoice.grandTotal)}</td></tr>
//         <tr><td style="font-weight:600;padding:8px 0">Due Date</td><td style="padding:8px 0">${fmtDate(invoice.dueDate)}</td></tr>
//       </table>

//       <div style="margin-top:18px;color:#374151;line-height:1.5">
//         <p>If you have already made the payment, please ignore this message or reply with payment details.</p>
//         <p>For any questions contact us at <a href="mailto:${companyInfo.contact.email}">${companyInfo.contact.email}</a> or call ${companyInfo.contact.phone1}.</p>
//       </div>

//       <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e6eef8;text-align:center">
//         <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://radiatechfire.in'}/admin/invoices" style="color:#0B3D91;font-weight:700;text-decoration:none">View Invoice in Portal</a>
//       </div>
//       <p style="color:#9ca3af;font-size:12px;margin-top:14px">${companyInfo.fullName} | ${companyInfo.contact.website}</p>
//     </div>
//   </div>
//   `;
// }

// export async function sendInvoiceReminderEmail(invoice: any, type: 'before3' | 'due' | 'after3' | 'after7') {
//   if (!invoice?.email) return { ok: false, error: 'No recipient' };

//   let subject = '';
//   let heading = '';
//   let intro = '';

//   switch (type) {
//     case 'before3':
//       subject = `Reminder: Invoice Due in 3 Days - Invoice #${invoice.invoiceNumber}`;
//       heading = 'Payment Reminder — Due in 3 Days';
//       intro = `This is a friendly reminder that Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} is due on <strong>${fmtDate(invoice.dueDate)}</strong>. We appreciate your prompt payment.`;
//       break;
//     case 'due':
//       subject = `Payment Due Today - Invoice #${invoice.invoiceNumber}`;
//       heading = 'Payment Due Today';
//       intro = `Your Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} is due today (${fmtDate(invoice.dueDate)}). Please arrange payment at your earliest convenience.`;
//       break;
//     case 'after3':
//       subject = `Overdue Payment Reminder - Invoice #${invoice.invoiceNumber}`;
//       heading = 'Overdue Payment — 3 Days';
//       intro = `Our records show Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} is overdue by 3 days (due ${fmtDate(invoice.dueDate)}). Please clear the outstanding amount.`;
//       break;
//     case 'after7':
//       subject = `Second Reminder - Outstanding Invoice #${invoice.invoiceNumber}`;
//       heading = 'Second Reminder — Outstanding Invoice';
//       intro = `This is a second reminder for Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} which is now 7 days past due (${fmtDate(invoice.dueDate)}). Kindly arrange payment or contact us to discuss.`;
//       break;
//   }

//   const html = buildHtml({ heading, intro, invoice });
//   // Skip if we've already sent this reminder for this invoice
//   try {
//     const existing = await prisma.invoiceReminder.findFirst({ where: { invoiceId: invoice.id, type } });
//     if (existing) {
//       return { ok: true, skipped: true, message: 'Reminder already sent' } as any;
//     }
//   } catch (err) {
//     // ignore db read errors and continue to attempt send
//   }

//   const res = await sendEmail({ to: [invoice.email], subject, html });

//   // Record reminder in DB when sent (or record attempt)
//   try {
//     await prisma.invoiceReminder.create({
//       data: {
//         invoiceId: invoice.id,
//         type,
//         meta: JSON.stringify({ sentAt: new Date().toISOString(), result: res }),
//       },
//     });
//   } catch (err) {
//     // non-fatal: log could be added here
//   }

//   return res;
// }

// export async function findInvoicesByDueDate(targetStart: Date, targetEnd: Date) {
//   return prisma.invoice.findMany({
//     where: {
//       dueDate: {
//         gte: targetStart,
//         lt: targetEnd,
//       },
//       email: { not: '' },
//     },
//   });
// }



import { companyInfo } from '@/data/company';
import { sendEmail } from './email';
import { prisma } from './prisma';

function fmtDate(d?: Date | string | null) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB');
}

function currency(n: number) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

function escapeHtml(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type ReminderType = 'before3' | 'due' | 'after3' | 'after7' | 'manual';

type InvoiceReminderInvoice = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  dueDate?: Date | string | null;
  email?: string | null;
  remindersPaused?: boolean | null;
};

type InvoiceReminderResult = {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
  message?: string;
};

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

async function getReminderPauseState(invoiceId: string) {
  await ensureRemindersPausedColumn();
  const [row] = await prisma.$queryRaw<Array<{ remindersPaused: boolean }>>`
    SELECT "remindersPaused"
    FROM "Invoice"
    WHERE "id" = ${invoiceId}
  `;
  return row?.remindersPaused ?? false;
}

function buildHtml({ heading, intro, invoice }: { heading: string; intro: string; invoice: InvoiceReminderInvoice }) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
    <div style="background:#0B3D91;padding:18px;border-radius:8px 8px 0 0;color:#fff">
      <h2 style="margin:0">${companyInfo.fullName}</h2>
      <p style="margin:4px 0 0;opacity:0.85">${companyInfo.tagline}</p>
    </div>
    <div style="background:#fff;padding:18px;border:1px solid #e6eef8;border-top:0;border-radius:0 0 8px 8px;color:#111">
      <h3 style="margin-top:0;color:#0b3d91">${heading}</h3>
      <p style="color:#374151">${intro}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <tr><td style="font-weight:600;padding:8px 0;width:160px">Invoice</td><td style="padding:8px 0">${escapeHtml(invoice.invoiceNumber)}</td></tr>
        <tr><td style="font-weight:600;padding:8px 0">Customer</td><td style="padding:8px 0">${escapeHtml(invoice.partyName)}</td></tr>
        <tr><td style="font-weight:600;padding:8px 0">Amount</td><td style="padding:8px 0">${currency(invoice.grandTotal)}</td></tr>
        <tr><td style="font-weight:600;padding:8px 0">Due Date</td><td style="padding:8px 0">${fmtDate(invoice.dueDate)}</td></tr>
      </table>

      <div style="margin-top:18px;color:#374151;line-height:1.5">
        <p>If you have already made the payment, please ignore this message or reply with payment details.</p>
        <p>For any questions contact us at <a href="mailto:${companyInfo.contact.email}">${companyInfo.contact.email}</a> or call ${companyInfo.contact.phone1}.</p>
      </div>

      <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e6eef8;text-align:center">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://radiatech.in'}/admin/invoices" style="color:#0B3D91;font-weight:700;text-decoration:none">View Invoice in Portal</a>
      </div>
    <p style="color:#9ca3af;font-size:12px;margin-top:14px">${companyInfo.fullName} | ${companyInfo.contact.website}</p>
    </div>
  </div>
  `;
}

export function buildPaymentReceivedEmailHtml({
  invoiceNumber,
  partyName,
  grandTotal,
  remainingAmount,
  dueDate,
}: {
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  remainingAmount: number;
  dueDate?: Date | string | null;
}) {
  const intro = `This is a Payment reminder from our team regarding Invoice <strong>#${escapeHtml(invoiceNumber)}</strong> for <strong>${currency(remainingAmount)}</strong> (Remaining Amount). Please review the outstanding amount at your earliest convenience.`;

  return `
  <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
    <div style="background:#0B3D91;padding:18px;border-radius:8px 8px 0 0;color:#fff">
      <h2 style="margin:0">${companyInfo.fullName}</h2>
      <p style="margin:4px 0 0;opacity:0.85">${companyInfo.tagline}</p>
    </div>
    <div style="background:#fff;padding:18px;border:1px solid #e6eef8;border-top:0;border-radius:0 0 8px 8px;color:#111">
      <h3 style="margin-top:0;color:#0b3d91">Payment Reminder</h3>
      <p style="color:#374151">${intro}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <tr><td style="font-weight:600;padding:8px 0;width:180px">Invoice</td><td style="padding:8px 0">${escapeHtml(invoiceNumber)}</td></tr>
        <tr><td style="font-weight:600;padding:8px 0">Customer</td><td style="padding:8px 0">${escapeHtml(partyName)}</td></tr>
        <tr><td style="font-weight:600;padding:8px 0">Total Amount</td><td style="padding:8px 0">${currency(grandTotal)}</td></tr>
        <tr><td style="font-weight:600;padding:8px 0">Remaining Amount</td><td style="padding:8px 0">${currency(remainingAmount)}</td></tr>
        <tr><td style="font-weight:600;padding:8px 0">Due Date</td><td style="padding:8px 0">${fmtDate(dueDate)}</td></tr>
      </table>

      <div style="margin-top:18px;padding:12px 14px;border:1px solid #fbbf24;border-radius:8px;background:#fffbeb;color:#92400e">
        <strong>Remaining Amount Alert:</strong> The outstanding balance is ${currency(remainingAmount)}. Please review it at your earliest convenience.
      </div>

      <div style="margin-top:18px;color:#374151;line-height:1.5">
        <p>If you have already made the payment, please ignore this message or reply with payment details.</p>
        <p>For any questions contact us at <a href="mailto:${companyInfo.contact.email}">${companyInfo.contact.email}</a> or call ${companyInfo.contact.phone1}.</p>
      </div>

      <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e6eef8;text-align:center">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://radiatech.in'}/admin/invoices" style="color:#0B3D91;font-weight:700;text-decoration:none">View Invoice in Portal</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin-top:14px">${companyInfo.fullName} | ${companyInfo.contact.website}</p>
    </div>
  </div>
  `;
}

export async function sendPaymentReceivedEmail(invoice: {
  email?: string | null;
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  remainingAmount: number;
  dueDate?: Date | string | null;
}) {
  if (!invoice?.email) return { ok: false, error: 'No recipient' };

  const subject = `Payment Reminder - Invoice #${invoice.invoiceNumber}`;
  const html = buildPaymentReceivedEmailHtml(invoice);
  return sendEmail({ to: [invoice.email], subject, html });
}

export async function sendInvoiceReminderEmail(invoice: InvoiceReminderInvoice, type: ReminderType): Promise<InvoiceReminderResult> {
  if (!invoice?.email) return { ok: false, error: 'No recipient' };
  const remindersPaused = invoice.remindersPaused ?? (await getReminderPauseState(invoice.id));
  if (remindersPaused) {
    return { ok: false, error: 'Reminders paused for invoice', skipped: true };
  }

  let subject = '';
  let heading = '';
  let intro = '';

  switch (type) {
    case 'before3':
      subject = `Reminder: Invoice Due in 3 Days - Invoice #${invoice.invoiceNumber}`;
      heading = 'Payment Reminder — Due in 3 Days';
      intro = `This is a friendly reminder that Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} is due on <strong>${fmtDate(invoice.dueDate)}</strong>. We appreciate your prompt payment.`;
      break;
    case 'due':
      subject = `Payment Due Today - Invoice #${invoice.invoiceNumber}`;
      heading = 'Payment Due Today';
      intro = `Your Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} is due today (${fmtDate(invoice.dueDate)}). Please arrange payment at your earliest convenience.`;
      break;
    case 'after3':
      subject = `Overdue Payment Reminder - Invoice #${invoice.invoiceNumber}`;
      heading = 'Overdue Payment — 3 Days';
      intro = `Our records show Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} is overdue by 3 days (due ${fmtDate(invoice.dueDate)}). Please clear the outstanding amount.`;
      break;
    case 'after7':
      subject = `Second Reminder - Outstanding Invoice #${invoice.invoiceNumber}`;
      heading = 'Second Reminder — Outstanding Invoice';
      intro = `This is a second reminder for Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)} which is now 7 days past due (${fmtDate(invoice.dueDate)}). Kindly arrange payment or contact us to discuss.`;
      break;
    case 'manual':
      subject = `Reminder - Invoice #${invoice.invoiceNumber}`;
      heading = 'Reminder';
      intro = `This is a Payment reminder from our team regarding Invoice <strong>#${invoice.invoiceNumber}</strong> for ${currency(invoice.grandTotal)}. Please review the outstanding amount at your earliest convenience.`;
      break;
  }

  const html = buildHtml({ heading, intro, invoice });
  // Skip if we've already sent this reminder for this invoice
  try {
    const existing = await prisma.invoiceReminder.findFirst({ where: { invoiceId: invoice.id, type } });
    if (existing) {
      return { ok: true, skipped: true, message: 'Reminder already sent' };
    }
  } catch {
    // ignore db read errors and continue to attempt send
  }

  const res = await sendEmail({ to: [invoice.email], subject, html });

  if (res.ok) {
    try {
      await prisma.invoiceReminder.create({
        data: {
          invoiceId: invoice.id,
          type,
          meta: JSON.stringify({ sentAt: new Date().toISOString(), result: res }),
        },
      });
    } catch {
      // non-fatal: log could be added here
    }
  }

  return res;
}

export async function findInvoicesByDueDate(targetStart: Date, targetEnd: Date) {
  await ensureRemindersPausedColumn();
  return prisma.$queryRaw<Array<{
    id: string;
    invoiceNumber: string;
    partyName: string;
    grandTotal: number;
    dueDate: Date | null;
    email: string;
  }>>`
    SELECT "id", "invoiceNumber", "partyName", "grandTotal", "dueDate", "email"
    FROM "Invoice"
    WHERE "dueDate" >= ${targetStart}
      AND "dueDate" < ${targetEnd}
      AND "email" <> ''
      AND COALESCE("remindersPaused", false) = false
  `;
}
