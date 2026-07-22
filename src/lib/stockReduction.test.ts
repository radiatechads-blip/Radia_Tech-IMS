import assert from "node:assert/strict";
import test from "node:test";

import { buildStockReductionPlan, shouldApplyStockReduction } from "./stockReduction";

test("buildStockReductionPlan creates stock reductions for matching products", () => {
  const plan = buildStockReductionPlan(
    [{ description: "Steel Sheet", qty: 2 }],
    [{ id: "prod-1", name: "Steel Sheet", stock: 10 }],
  );

  assert.deepEqual(plan, [{ productId: "prod-1", qty: 2 }]);
});

test("buildStockReductionPlan allows stock to move below zero", () => {
  const plan = buildStockReductionPlan(
    [{ description: "Steel Sheet", qty: 12 }],
    [{ id: "prod-1", name: "Steel Sheet", stock: 10 }],
  );

  assert.deepEqual(plan, [{ productId: "prod-1", qty: 12 }]);
});

test("shouldApplyStockReduction only runs for invoice and annexure documents", () => {
  assert.equal(shouldApplyStockReduction("invoice"), true);
  assert.equal(shouldApplyStockReduction("annexure"), true);
  assert.equal(shouldApplyStockReduction("quotation"), false);
  assert.equal(shouldApplyStockReduction("proforma"), false);
});
