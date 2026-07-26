export type PendingMaterialTaxType = "cgst-sgst" | "igst" | "none";

export interface PendingMaterialFormState {
  customerName: string;
  customerCompany: string;
  customerPhone: string;
  customerEmail: string;
  customerGst: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  billingDate: string;
  invoiceNumber: string;
  preparedBy: string;
  notes: string;
  terms: string;
  roundOffAmount: number;
  taxType: PendingMaterialTaxType;
  globalTaxPercent: number;
  items: Array<{
    id: number;
    productName: string;
    qty: number;
    unit: string;
    rate: number;
  }>;
}

function toNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function mapPendingMaterialInvoiceToFormState(
  invoice: Record<string, unknown> | null | undefined,
  fallbackDate: string,
  fallbackInvoiceNumber: string,
  fallbackPreparedBy: string,
  fallbackNotes: string,
  fallbackTerms: string,
): PendingMaterialFormState {
  const rawItems = Array.isArray(invoice?.items) ? invoice.items : [];
  const itemRecords = rawItems
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => ({
      id: index + 1,
      productName: toString(item.description, ""),
      qty: toNumber(item.qty, 1),
      unit: toString(item.unit, "Nos"),
      rate: toNumber(item.rate, 0),
    }));

  const fallbackTaxType: PendingMaterialTaxType = "cgst-sgst";
  const taxType = String(invoice?.taxType ?? "").trim().toLowerCase();
  const normalizedTaxType = taxType === "igst" || taxType === "none" || taxType === "cgst-sgst"
    ? (taxType as PendingMaterialTaxType)
    : fallbackTaxType;

  const firstItemTaxPercent = rawItems.length > 0
    ? toNumber((rawItems[0] as Record<string, unknown> | undefined)?.taxPercent, 18)
    : 18;

  return {
    customerName: toString(invoice?.contactPerson, toString(invoice?.partyName, "")),
    customerCompany: toString(invoice?.partyName, "") && toString(invoice?.contactPerson, "") ? toString(invoice?.partyName, "") : "",
    customerPhone: toString(invoice?.phone, ""),
    customerEmail: toString(invoice?.email, ""),
    customerGst: toString(invoice?.gstin, ""),
    customerAddress: toString(invoice?.address, ""),
    customerCity: toString(invoice?.city, ""),
    customerState: toString(invoice?.state, ""),
    customerPincode: toString(invoice?.pincode, ""),
    billingDate: toString(invoice?.invoiceDate, fallbackDate).slice(0, 10),
    invoiceNumber: toString(invoice?.invoiceNumber, fallbackInvoiceNumber),
    preparedBy: toString(invoice?.authorizedSignature, fallbackPreparedBy),
    notes: toString(invoice?.notes, fallbackNotes) || fallbackNotes,
    terms: toString(invoice?.terms, fallbackTerms) || fallbackTerms,
    roundOffAmount: toNumber(invoice?.roundOff, 0),
    taxType: normalizedTaxType,
    globalTaxPercent: firstItemTaxPercent > 0 ? firstItemTaxPercent : 18,
    items: itemRecords.length > 0 ? itemRecords : [{ id: 1, productName: "", qty: 1, unit: "Nos", rate: 0 }],
  };
}
