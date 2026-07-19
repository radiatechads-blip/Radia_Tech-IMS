export type InvoiceRange = "thisMonth" | "lastMonth" | "thisWeek" | "thisQuarter" | "halfYear" | "thisYear";

export type TaxInvoiceChartPoint = {
  label: string;
  amount: number;
};

export type TaxInvoiceChartInvoice = {
  invoiceDate?: string | Date | null;
  grandTotal?: number | string | null;
};

const RANGE_OPTIONS: InvoiceRange[] = ["thisMonth", "lastMonth", "thisWeek", "thisQuarter", "halfYear", "thisYear"];

export function normalizeInvoiceRange(value: string | null | undefined): InvoiceRange {
  return RANGE_OPTIONS.includes((value as InvoiceRange) ?? "") ? (value as InvoiceRange) : "thisMonth";
}

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function endOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function buildDateRange(range: InvoiceRange, now: Date) {
  switch (range) {
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "thisWeek": {
      const start = startOfDay(new Date(now));
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      return { start, end: endOfDay(now) };
    }
    case "thisQuarter": {
      const month = now.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = new Date(now.getFullYear(), quarterStartMonth, 1);
      const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "halfYear": {
      const start = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
      const end = new Date(now.getFullYear(), now.getMonth() < 6 ? 5 : 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    case "thisMonth":
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

function formatLabel(date: Date, range: InvoiceRange) {
  switch (range) {
    case "thisWeek":
      return date.toLocaleDateString("en-IN", { weekday: "short" });
    case "thisYear":
      return date.toLocaleDateString("en-IN", { month: "short" });
    case "halfYear":
      return date.toLocaleDateString("en-IN", { month: "short" });
    case "thisQuarter":
      return date.toLocaleDateString("en-IN", { month: "short" });
    case "lastMonth":
    case "thisMonth":
    default:
      return String(date.getDate());
  }
}

function buildBuckets(range: InvoiceRange, start: Date, end: Date) {
  const buckets: TaxInvoiceChartPoint[] = [];
  const step = range === "thisWeek" ? 1 : 1;

  if (range === "thisWeek") {
    const current = new Date(start);
    while (current <= end) {
      buckets.push({ label: formatLabel(current, range), amount: 0 });
      current.setDate(current.getDate() + step);
    }
    return buckets;
  }

  if (range === "thisYear" || range === "halfYear" || range === "thisQuarter") {
    const current = new Date(start);
    while (current <= end) {
      buckets.push({ label: formatLabel(current, range), amount: 0 });
      if (range === "thisYear") current.setMonth(current.getMonth() + 1);
      else if (range === "halfYear") current.setMonth(current.getMonth() + 1);
      else current.setMonth(current.getMonth() + 1);
    }
    return buckets;
  }

  const current = new Date(start);
  while (current <= end) {
    buckets.push({ label: formatLabel(current, range), amount: 0 });
    current.setDate(current.getDate() + step);
  }
  return buckets;
}

export function buildTaxInvoiceChartData(invoices: TaxInvoiceChartInvoice[], range: string, now: Date = new Date()): TaxInvoiceChartPoint[] {
  const normalizedRange = normalizeInvoiceRange(range);
  const { start, end } = buildDateRange(normalizedRange, now);
  const buckets = buildBuckets(normalizedRange, start, end);

  for (const invoice of invoices) {
    const rawDate = invoice.invoiceDate ?? null;
    const parsedDate = rawDate ? new Date(rawDate) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) continue;
    if (parsedDate < start || parsedDate > end) continue;

    const amount = Number(invoice.grandTotal || 0);

    let bucketIndex = -1;
    if (normalizedRange === "thisWeek") {
      bucketIndex = Math.floor((parsedDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    } else if (normalizedRange === "thisYear" || normalizedRange === "halfYear" || normalizedRange === "thisQuarter") {
      bucketIndex = parsedDate.getMonth() - start.getMonth() + (parsedDate.getFullYear() - start.getFullYear()) * 12;
    } else {
      bucketIndex = parsedDate.getDate() - start.getDate();
    }

    if (bucketIndex >= 0 && bucketIndex < buckets.length) {
      buckets[bucketIndex].amount += amount;
    }
  }

  return buckets;
}
