export type BillReportColumnKey =
  | "date"
  | "billNumber"
  | "customerName"
  | "total"
  | "paymentType"
  | "receivedOrPaid"
  | "remainingBalance"
  | "gstin";

export interface BillReportRow {
  date: string;
  billNumber: string;
  customerName: string;
  total: string;
  paymentType: string;
  receivedOrPaid: string;
  remainingBalance: string;
  gstin: string;
}

export interface BillReportRecord {
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  partyName?: string | null;
  grandTotal?: number | string | null;
  paymentMode?: string | null;
  amountPaid?: number | string | null;
  gstin?: string | null;
}

export const BILL_REPORT_COLUMN_OPTIONS = [
  { key: "date", label: "Date" },
  { key: "billNumber", label: "Bill No" },
  { key: "customerName", label: "Customer Name" },
  { key: "total", label: "Total" },
  { key: "paymentType", label: "Payment Type" },
  { key: "receivedOrPaid", label: "Received / Paid" },
  { key: "remainingBalance", label: "Remaining Balance" },
  { key: "gstin", label: "GSTIN" },
] as const;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toCurrency(value: number | string | null | undefined) {
  const numericValue = Number(value || 0);
  return `₹${currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0)}`;
}

function toDisplayDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function buildBillReportRows(
  records: BillReportRecord[],
  selectedColumns: BillReportColumnKey[],
) {
  return records.map((record) => {
    const totalAmount = Number(record.grandTotal || 0);
    const paidAmount = Number(record.amountPaid || 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const row: Partial<BillReportRow> = {};

    if (selectedColumns.includes("date")) {
      row.date = toDisplayDate(record.invoiceDate ?? null);
    }
    if (selectedColumns.includes("billNumber")) {
      row.billNumber = String(record.invoiceNumber || "-");
    }
    if (selectedColumns.includes("customerName")) {
      row.customerName = String(record.partyName || "-");
    }
    if (selectedColumns.includes("total")) {
      row.total = toCurrency(totalAmount);
    }
    if (selectedColumns.includes("paymentType")) {
      row.paymentType = String(record.paymentMode || "-");
    }
    if (selectedColumns.includes("receivedOrPaid")) {
      row.receivedOrPaid = paidAmount > 0 ? "Received" : "Pending";
    }
    if (selectedColumns.includes("remainingBalance")) {
      row.remainingBalance = toCurrency(remainingAmount);
    }
    if (selectedColumns.includes("gstin")) {
      row.gstin = String(record.gstin || "-");
    }

    return row as BillReportRow;
  });
}

export function exportBillReport<T extends object>(rows: T[], fileName = "bill-report") {
  const headers = Object.keys(rows[0] ?? {});
  const csvRows = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => {
      const value = (row as Record<string, unknown>)[header];
      const normalized = value == null ? "" : String(value).replace(/\r?\n/g, " ").replace(/"/g, '""');
      return `"${normalized}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
