import assert from "node:assert/strict";
import test from "node:test";

import { buildStockReductionPlan } from "./stockReduction";

test("buildStockReductionPlan creates stock reductions for matching products", () => {
  const plan = buildStockReductionPlan(
    [{ description: "Steel Sheet", qty: 2 }],
    [{ id: "prod-1", name: "Steel Sheet", stock: 10 }],
  );

  assert.deepEqual(plan, [{ productId: "prod-1", qty: 2 }]);
});

test("buildStockReductionPlan throws when a product does not have enough stock", () => {
  assert.throws(
    () =>
      buildStockReductionPlan(
        [{ description: "Steel Sheet", qty: 12 }],
        [{ id: "prod-1", name: "Steel Sheet", stock: 10 }],
      ),
    /Insufficient stock/i,
  );
});
