import assert from "node:assert/strict";
import test from "node:test";

import { BILL_REPORT_COLUMN_OPTIONS, buildBillReportRows } from "./billReport";

test("buildBillReportRows maps the requested columns into export-ready rows", () => {
  const rows = buildBillReportRows(
    [
      {
        invoiceNumber: "TI-101",
        invoiceDate: "2026-07-01",
        partyName: "Acme Corp",
        grandTotal: 1250,
        paymentMode: "Cash",
        amountPaid: 500,
        gstin: "29ABCDE1234F1Z5",
      },
    ],
    ["date", "billNumber", "customerName", "total", "paymentType", "receivedOrPaid", "remainingBalance", "gstin"],
  );

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    date: "01/07/2026",
    billNumber: "TI-101",
    customerName: "Acme Corp",
    total: "₹1,250.00",
    paymentType: "Cash",
    receivedOrPaid: "Received",
    remainingBalance: "₹750.00",
    gstin: "29ABCDE1234F1Z5",
  });
  assert.ok(BILL_REPORT_COLUMN_OPTIONS.some((option) => option.key === "date"));
});
