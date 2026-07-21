export type DocumentType = "invoice" | "proforma" | "annexure" | "quotation";

export function normalizeDocumentType(data: Record<string, unknown>): DocumentType {
  const explicit = String(
    data.documentType || data.billType || data.invoiceNumber || "",
  )
    .trim()
    .toLowerCase();

  if (explicit.includes("proforma")) {
    return "proforma";
  }

  if (explicit.includes("annexure") || explicit.includes("long")) {
    return "annexure";
  }

  if (explicit.includes("quotation") || explicit.startsWith("qtn")) {
    return "quotation";
  }

  return "invoice";
}
