import assert from "node:assert/strict";
import test from "node:test";

import { calculateQuotationTotals } from "./quotationTotals";

test("calculateQuotationTotals applies round-off to the grand total and keeps tax proportional after extra discount", () => {
  const totals = calculateQuotationTotals({
    items: [
      { qty: 1, rate: 100, discountPercent: 0, taxPercent: 10 },
    ],
    taxType: "cgst-sgst",
    extraDiscountAmount: 10,
    roundOffAmount: 2,
  });

  assert.equal(totals.taxableBeforeExtraDiscount, 100);
  assert.equal(totals.taxable, 90);
  assert.equal(totals.tax, 9);
  assert.equal(totals.grandTotal, 101);
});
