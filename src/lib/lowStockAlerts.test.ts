import { describe, expect, it } from "vitest";
import { buildLowStockAlerts, LOW_STOCK_THRESHOLD } from "./lowStockAlerts";

describe("buildLowStockAlerts", () => {
  it("returns products whose stock is below the threshold", () => {
    const alerts = buildLowStockAlerts([
      { id: "1", name: "Steel Pipe", stock: 40 },
      { id: "2", name: "Cable", stock: 60 },
      { id: "3", name: "Switch", stock: 0 },
    ]);

    expect(alerts).toEqual([
      { id: "3", name: "Switch", stock: 0 },
      { id: "1", name: "Steel Pipe", stock: 40 },
    ]);
  });

  it("uses the configured low-stock threshold", () => {
    const alerts = buildLowStockAlerts([{ id: "1", name: "Panel", stock: LOW_STOCK_THRESHOLD }]);

    expect(alerts).toEqual([]);
  });
});
