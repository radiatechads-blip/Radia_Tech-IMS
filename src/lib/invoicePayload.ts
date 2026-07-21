function safeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const candidate = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function getInvoiceFinancialYear(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return `${String(startYear % 100).padStart(2, "0")}-${String(endYear % 100).padStart(2, "0")}`;
}

function generateInvoiceSerial(existingNumbers: Set<string>, prefix: string) {
  let maxSerial = 0;

  for (const invoiceNumber of existingNumbers) {
    if (!invoiceNumber.startsWith(prefix)) {
      continue;
    }

    const serial = invoiceNumber.slice(prefix.length);
    const match = /^([0-9]{3})$/.exec(serial);
    if (!match) {
      continue;
    }

    const value = Number(match[1]);
    if (value > maxSerial) {
      maxSerial = value;
    }
  }

  return String(Math.min(maxSerial + 1, 999)).padStart(3, "0");
}

function getInvoicePrefix(documentType: "invoice" | "proforma" | "annexure" | "quotation") {
  if (documentType === "proforma") {
    return "PFI-";
  }

  if (documentType === "annexure") {
    return "ANN-";
  }

  if (documentType === "quotation") {
    return "QTN-";
  }

  return "INV-";
}

export function getConversionSourceLabel(documentType: "invoice" | "proforma" | "annexure" | "quotation") {
  if (documentType === "quotation") {
    return "Quotation";
  }

  if (documentType === "proforma") {
    return "Proforma Invoice";
  }

  return "Proforma Invoice";
}

export function resolveInvoiceNumber(
  data: Record<string, unknown>,
  documentType: "invoice" | "proforma" | "annexure" | "quotation",
  usedNumbers: Iterable<string> = [],
) {
  const explicit = String(data.invoiceNumber || data.annexureNumber || "").trim();
  const existingNumbers = new Set(usedNumbers);

  if (explicit && !existingNumbers.has(explicit)) {
    return explicit;
  }

  const fallbackDate = resolveInvoiceDate(data);
  if (documentType === "invoice") {
    const prefix = `RAD/${getInvoiceFinancialYear(fallbackDate)}/`;
    return `${prefix}${generateInvoiceSerial(existingNumbers, prefix)}`;
  }

  const prefix = getInvoicePrefix(documentType);
  let attempt = 0;

  while (true) {
    const suffix = `${String(fallbackDate.getFullYear()).slice(-2)}${String(fallbackDate.getMonth() + 1).padStart(2, "0")}${String(fallbackDate.getDate()).padStart(2, "0")}-${String(attempt + 1).padStart(3, "0")}`;
    const candidate = `${prefix}${suffix}`;
    if (!existingNumbers.has(candidate)) {
      return candidate;
    }
    attempt += 1;
  }
}

export function resolveInvoiceDate(data: Record<string, unknown>) {
  const explicit = safeDate(data.invoiceDate || data.annexureDate);
  if (explicit) {
    return explicit;
  }

  const fallback = safeDate(data.createdAt || data.created_at);
  if (fallback) {
    return fallback;
  }

  return new Date();
}
