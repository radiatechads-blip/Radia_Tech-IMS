import assert from "node:assert/strict";
import test from "node:test";

import { getConversionSourceLabel, resolveInvoiceDate, resolveInvoiceNumber } from "./invoicePayload";

test("resolveInvoiceNumber falls back to a generated value for missing numbers", () => {
  const value = resolveInvoiceNumber({}, "invoice");
  assert.match(value, /^RAD\/\d{2}-\d{2}\/\d{3}$/);
});

test("resolveInvoiceNumber generates RAD/financial-year serials for invoices", () => {
  const value = resolveInvoiceNumber({ invoiceDate: "2026-05-05" }, "invoice");
  assert.equal(value, "RAD/26-27/001");
});

test("resolveInvoiceNumber increments RAD invoice serial numbers within the same financial year", () => {
  const value = resolveInvoiceNumber(
    { invoiceDate: "2026-12-01" },
    "invoice",
    new Set(["RAD/26-27/001", "RAD/26-27/002"]),
  );
  assert.equal(value, "RAD/26-27/003");
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
