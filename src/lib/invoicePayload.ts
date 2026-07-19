function safeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const candidate = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function generateInvoiceSuffix(date: Date, attempt = 0) {
  const base = Number(String(date.getTime()).slice(-6).padStart(6, "0"));
  const next = (base + attempt) % 1000000;
  return String(next).padStart(6, "0");
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

  const fallbackDate = new Date();
  const prefix = getInvoicePrefix(documentType);
  let attempt = 0;

  while (true) {
    const suffix = generateInvoiceSuffix(fallbackDate, attempt);
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
