import assert from "node:assert/strict";
import test from "node:test";

import { buildTaxInvoiceChartData, normalizeInvoiceRange } from "./taxInvoiceChart";

test("builds day buckets for the selected month", () => {
  const result = buildTaxInvoiceChartData(
    [
      { invoiceDate: "2026-07-03T00:00:00.000Z", grandTotal: 200 },
      { invoiceDate: "2026-07-16T00:00:00.000Z", grandTotal: 300 },
    ],
    "thisMonth",
    new Date("2026-07-15T00:00:00.000Z")
  );

  const july3 = result.find((item) => item.label === "3");
  const july16 = result.find((item) => item.label === "16");

  assert.equal(july3?.amount, 200);
  assert.equal(july16?.amount, 300);
});

test("defaults unknown ranges to this month", () => {
  assert.equal(normalizeInvoiceRange("unknown"), "thisMonth");
});
