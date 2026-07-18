//lib/invoiceRoute.ts
export type InvoiceSummary = {
  id?: string | null;
  billType?: string | null;
  invoiceNumber?: string | null;
  partyName?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  invoiceDate?: string | null;
  createdAt?: string | null;
  poDate?: string | null;
  ewayBillNo?: string | null;
  poNo?: string | null;
  placeOfSupply?: string | null;
  dueDate?: string | null;
  shipToAddress?: string | null;
  transportName?: string | null;
  vehicleNumber?: string | null;
  taxType?: string | null;
  paymentMode?: string | null;
  notes?: string | null;
  terms?: string | null;
  bankDetails?: string | null;
  authorizedSignature?: string | null;
  signatureImage?: string | null;
  extraDiscountAmount?: number | string | null;
  roundOff?: number | string | null;
  items?: Array<{
    id?: string | number | null;
    description?: string | null;
    hsn?: string | null;
    unit?: string | null;
    qty?: number | string | null;
    rate?: number | string | null;
    taxPercent?: number | string | null;
    discountPercent?: number | string | null;
  }>;
  [key: string]: unknown;
};

export type InvoiceRouteLike = {
  id?: string | null;
  billType?: string | null;
  invoiceNumber?: string | null;
};

export function getBillTypeLabel(invoice?: InvoiceRouteLike | null) {
  if (!invoice) {
    return "Tax Invoice";
  }

  const billType = String(invoice.billType ?? "").trim().toLowerCase();
  const invoiceNumber = String(invoice.invoiceNumber ?? "").trim().toUpperCase();

  if (
    billType.includes("proforma") ||
    invoiceNumber.startsWith("PMA") ||
    invoiceNumber.startsWith("PRF") ||
    invoiceNumber.startsWith("PF")
  ) {
    return "Proforma Invoice";
  }

  if (
    billType.includes("annexure") ||
    billType.includes("long") ||
    invoiceNumber.startsWith("ANN") ||
    invoiceNumber.startsWith("ANX")
  ) {
    return "Annexure";
  }

  if (billType.includes("material") || billType.includes("pending") || invoiceNumber.startsWith("MAT")) {
    return "Pending Material";
  }

  if (billType.includes("quotation") || invoiceNumber.startsWith("QTN")) {
    return "Quotation";
  }

  return "Tax Invoice";
}

export function getInvoiceEditRoute(invoice?: InvoiceRouteLike | null) {
  if (!invoice?.id) {
    return "/admin/generate-bill/invoice";
  }

  const billType = String(invoice.billType ?? "").trim().toLowerCase();
  const invoiceNumber = String(invoice.invoiceNumber ?? "").trim().toUpperCase();

  if (
    billType.includes("proforma") ||
    invoiceNumber.startsWith("PMA") ||
    invoiceNumber.startsWith("PRF") ||
    invoiceNumber.startsWith("PF")
  ) {
    return `/admin/generate-bill/proforma-invoice?invoiceId=${invoice.id}`;
  }

  if (
    billType.includes("annexure") ||
    billType.includes("long") ||
    invoiceNumber.startsWith("ANN") ||
    invoiceNumber.startsWith("ANX")
  ) {
    return `/admin/generate-bill/long-bills?invoiceId=${invoice.id}`;
  }

  if (billType.includes("material") || billType.includes("pending") || invoiceNumber.startsWith("MAT")) {
    return `/admin/generate-bill/pending-material?invoiceId=${invoice.id}`;
  }

  if (billType.includes("quotation") || invoiceNumber.startsWith("QTN")) {
    return `/admin/generate-bill/quotation?invoiceId=${invoice.id}`;
  }

  return `/admin/generate-bill/invoice?invoiceId=${invoice.id}`;
}
