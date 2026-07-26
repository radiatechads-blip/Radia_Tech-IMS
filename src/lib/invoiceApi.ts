export type DocumentType = "invoice" | "proforma" | "annexure" | "quotation" | "delivery-challan" | "debit-note" | "credit-note" | "pending-material";

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

  if (explicit.includes("delivery") || explicit.includes("challan") || explicit.startsWith("dc")) {
    return "delivery-challan";
  }

  if (explicit.includes("debit") || explicit.includes("dn") || explicit.includes("debit note")) {
    return "debit-note";
  }

  if (explicit.includes("credit") || explicit.includes("cn") || explicit.includes("credit note")) {
    return "credit-note";
  }

  if (explicit.includes("pending") || explicit.includes("pending material") || explicit.includes("pm")) {
    return "pending-material";
  }

  return "invoice";
}
