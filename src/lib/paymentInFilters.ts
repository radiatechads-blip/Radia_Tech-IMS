export type PaymentDateFilter = "all" | "thisMonth" | "lastMonth" | "thisQuarter" | "thisYear" | "custom";

function normalizeDateValue(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    return {
      year: Number(dateOnlyMatch[1]),
      month: Number(dateOnlyMatch[2]),
      day: Number(dateOnlyMatch[3]),
    };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

function isDateInRange(dateValue: ReturnType<typeof normalizeDateValue>, start: ReturnType<typeof normalizeDateValue>, end: ReturnType<typeof normalizeDateValue>) {
  if (!dateValue || !start || !end) return false;

  const dateKey = dateValue.year * 10000 + dateValue.month * 100 + dateValue.day;
  const startKey = start.year * 10000 + start.month * 100 + start.day;
  const endKey = end.year * 10000 + end.month * 100 + end.day;

  return dateKey >= startKey && dateKey <= endKey;
}

export function getPaymentFilterDate(invoice: {
  paymentDate?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
}) {
  return normalizeDateValue(invoice.invoiceDate ?? invoice.paymentDate ?? invoice.dueDate);
}

export function matchesPaymentDateFilter(
  invoice: {
    paymentDate?: string | null;
    invoiceDate?: string | null;
    dueDate?: string | null;
  },
  filter: PaymentDateFilter,
  customStartDate: string,
  customEndDate: string,
  referenceDate: Date = new Date(),
) {
  if (filter === "all") return true;

  const invoiceDate = getPaymentFilterDate(invoice);
  if (!invoiceDate) return false;

  if (filter === "custom") {
    if (!customStartDate || !customEndDate) return false;

    const start = normalizeDateValue(customStartDate);
    const end = normalizeDateValue(customEndDate);
    if (!start || !end) return false;

    return isDateInRange(invoiceDate, start, end);
  }

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (filter === "thisMonth") {
    const start = { year, month: month + 1, day: 1 };
    const end = { year, month: month + 1, day: 31 };
    return isDateInRange(invoiceDate, start, end);
  }

  if (filter === "lastMonth") {
    const lastMonthIndex = month === 0 ? 12 : month;
    const lastMonthYear = month === 0 ? year - 1 : year;
    const start = { year: lastMonthYear, month: lastMonthIndex, day: 1 };
    const end = { year: lastMonthYear, month: lastMonthIndex, day: 31 };
    return isDateInRange(invoiceDate, start, end);
  }

  if (filter === "thisQuarter") {
    const quarterStartMonth = Math.floor(month / 3) * 3 + 1;
    const quarterEndMonth = quarterStartMonth + 2;
    const start = { year, month: quarterStartMonth, day: 1 };
    const end = { year, month: quarterEndMonth, day: 31 };
    return isDateInRange(invoiceDate, start, end);
  }

  const start = { year, month: 1, day: 1 };
  const end = { year, month: 12, day: 31 };
  return isDateInRange(invoiceDate, start, end);
}
