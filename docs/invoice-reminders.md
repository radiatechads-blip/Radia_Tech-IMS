# Invoice Due Date Email Notification System

## Overview

This system sends automated invoice reminder emails at the following intervals relative to the invoice due date:

- 3 days before due date: friendly reminder
- On due date: payment due today
- 3 days after due date: first overdue reminder
- 7 days after due date: second overdue reminder

## How it works

- `src/lib/invoiceEmails.ts` contains templates and helpers to build and send emails using the existing `src/lib/email.ts` (Resend client).
- `src/app/api/notifications/send-due/route.ts` is a server API endpoint you can call to run the job manually (GET).
- `scripts/send-due-reminders.ts` is a runnable script intended for cron or CI (run with `ts-node`).

## Environment

Ensure the following environment variables are set in your deployment environment:

- `RESEND_API_KEY` — API key for Resend email delivery
- `EMAIL_FROM` — optional from address
- `DATABASE_URL` — Postgres connection string used by Prisma
- `NEXT_PUBLIC_SITE_URL` — base site URL used in links

## Run manually

To trigger reminders manually (from server):

1. Call the API route (server-side):

GET /api/notifications/send-due

2. Or run the script (requires `ts-node`):

```bash
npm install -D ts-node date-fns
npx ts-node scripts/send-due-reminders.ts
```

## Scheduling (recommended)

Set a cron job to run the script daily (example runs at 9:00 AM):

```cron
0 9 * * * cd /path/to/project && npx ts-node scripts/send-due-reminders.ts >> /var/log/invoice-reminders.log 2>&1
```

## Notes & safety

- The system only sends reminders for invoices with a non-empty `email` and a `dueDate` matching the target date range.
- If you need to skip invoices that are already paid, add a `paid` flag or check export function buildPaymentReceivedEmailHtml({
  invoiceNumber,
  partyName,
  grandTotal,
  remainingAmount,
  dueDate,
  amountReceived,
  paymentMode,
}: {
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  remainingAmount: number;
  dueDate?: Date | string | null;
  amountReceived?: number;
  await sendPaymentReceivedEmail({
  email: invoice.email,
  invoiceNumber: invoice.invoiceNumber,
  partyName: invoice.partyName,
  grandTotal: invoice.grandTotal,
  remainingAmount: remainingAfterPayment,
  amountReceived: amount,
  paymentMode: paymentMode,
  dueDate: invoice.dueDate,
});cords and update the `findInvoicesByDueDate` query accordingly.
