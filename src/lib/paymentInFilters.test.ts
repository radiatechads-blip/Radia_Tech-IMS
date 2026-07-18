import { describe, expect, it } from "vitest";
import { matchesPaymentDateFilter } from "./paymentInFilters";

describe("matchesPaymentDateFilter", () => {
  it("matches invoices in the current month using invoice dates", () => {
    const today = new Date("2026-07-15T10:00:00Z");
    const invoice = { invoiceDate: "2026-07-10" };

    expect(matchesPaymentDateFilter(invoice, "thisMonth", "", "", today)).toBe(true);
  });

  it("matches custom date ranges using invoice dates", () => {
    const today = new Date("2026-07-15T10:00:00Z");
    const invoice = { invoiceDate: "2026-06-20" };

    expect(matchesPaymentDateFilter(invoice, "custom", "2026-06-01", "2026-06-30", today)).toBe(true);
    expect(matchesPaymentDateFilter(invoice, "custom", "2026-07-01", "2026-07-31", today)).toBe(false);
  });

  it("falls back to due date when invoice date is missing", () => {
    const today = new Date("2026-07-15T10:00:00Z");
    const invoice = { dueDate: "2026-07-08" };

    expect(matchesPaymentDateFilter(invoice, "thisMonth", "", "", today)).toBe(true);
  });

  it("handles ISO datetime strings without misparsing them", () => {
    const today = new Date("2026-07-15T10:00:00Z");
    const invoice = { invoiceDate: "2026-07-10T09:30:00.000Z" };

    expect(matchesPaymentDateFilter(invoice, "thisMonth", "", "", today)).toBe(true);
  });
});
