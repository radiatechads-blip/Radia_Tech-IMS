import assert from "node:assert/strict";
import test from "node:test";

import { getConversionSourceLabel, resolveInvoiceDate, resolveInvoiceNumber } from "./invoicePayload";

test("resolveInvoiceNumber falls back to a generated value for missing numbers", () => {
  const value = resolveInvoiceNumber({}, "invoice");
  assert.match(value, /^INV-\d{6}$/);
});

test("resolveInvoiceDate falls back to the current date for missing or invalid values", () => {
  const value = resolveInvoiceDate({});
  assert.ok(value instanceof Date);
  assert.equal(Number.isNaN(value.getTime()), false);
});

test("resolveInvoiceNumber skips a duplicate explicit number when the value is already used", () => {
  const value = resolveInvoiceNumber({ invoiceNumber: "INV-000001" }, "invoice", new Set(["INV-000001"]));
  assert.notEqual(value, "INV-000001");
  assert.match(value, /^INV-\d{6}$/);
});

test("getConversionSourceLabel returns the correct source label for quotations", () => {
  assert.equal(getConversionSourceLabel("quotation"), "Quotation");
});
