import assert from "node:assert/strict";
import test from "node:test";

import { normalizeDocumentType } from "./invoiceApi";

test("normalizeDocumentType treats quotation payloads as quotation documents", () => {
  assert.equal(normalizeDocumentType({ documentType: "quotation" }), "quotation");
  assert.equal(normalizeDocumentType({ billType: "Quotation" }), "quotation");
  assert.equal(normalizeDocumentType({ invoiceNumber: "QTN-123" }), "quotation");
});

test("normalizeDocumentType leaves invoice payloads as invoices", () => {
  assert.equal(normalizeDocumentType({ documentType: "invoice" }), "invoice");
  assert.equal(normalizeDocumentType({ billType: "Tax Invoice" }), "invoice");
});
