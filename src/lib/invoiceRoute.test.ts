import assert from "node:assert/strict";
import test from "node:test";

import { getDuplicateCopyInvoiceNumber, getDuplicateCopyPageLabels, getInvoiceDuplicateFlag } from "./invoiceRoute";

test("getDuplicateCopyPageLabels returns split labels for duplicate copies", () => {
  assert.deepEqual(getDuplicateCopyPageLabels(true), ["Original for Recipient", "Duplicate Copy"]);
});

test("getDuplicateCopyPageLabels returns the original label for standard invoices", () => {
  assert.deepEqual(getDuplicateCopyPageLabels(false), ["Original for Recipient"]);
  assert.deepEqual(getDuplicateCopyPageLabels(undefined), ["Original for Recipient"]);
});

test("getInvoiceDuplicateFlag infers duplicates from invoice numbers", () => {
  assert.equal(getInvoiceDuplicateFlag({ invoiceNumber: "INV-100 (Duplicate)" }), true);
  assert.equal(getInvoiceDuplicateFlag({ invoiceNumber: "INV-100 Duplicate" }), true);
  assert.equal(getInvoiceDuplicateFlag({ invoiceNumber: "INV-101" }), false);
  assert.equal(getInvoiceDuplicateFlag({ isDuplicate: true }), true);
});

test("getDuplicateCopyInvoiceNumber appends or removes the duplicate suffix consistently", () => {
  assert.equal(getDuplicateCopyInvoiceNumber("INV-100", true), "INV-100 (Duplicate)");
  assert.equal(getDuplicateCopyInvoiceNumber("INV-100 (Duplicate)", true), "INV-100 (Duplicate)");
  assert.equal(getDuplicateCopyInvoiceNumber("INV-100 (Duplicate)", false), "INV-100");
  assert.equal(getDuplicateCopyInvoiceNumber("", true), "Duplicate");
  assert.equal(getDuplicateCopyInvoiceNumber("", false), "");
});
