import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPaymentReceivedEmailHtml } from './invoiceEmails';

test('buildPaymentReceivedEmailHtml uses remaining amount in the message and includes the requested fields', () => {
  const html = buildPaymentReceivedEmailHtml({
    invoiceNumber: 'INV-1001',
    partyName: 'ABC Traders',
    grandTotal: 1200,
    remainingAmount: 450,
    paidAmount: 750,
    dueDate: '2026-07-20',
  });

  assert.match(html, /Invoice/i);
  assert.match(html, /Customer/i);
  assert.match(html, /Total Amount/i);
  assert.match(html, /Remaining Amount/i);
  assert.match(html, /Due Date/i);
  assert.match(html, /Payment Status/i);
  assert.match(html, /Partially Paid/i);
  assert.match(html, /Remaining Amount Alert/i);
  assert.match(html, /for <strong>₹450\.00<\/strong> \(Remaining Amount\)/i);
  assert.doesNotMatch(html, /for <strong>₹1200\.00<\/strong>/i);
});
