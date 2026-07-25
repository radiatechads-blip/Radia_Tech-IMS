export type QuotationTotalsInput = {
  items: Array<{
    qty?: number | string | null;
    rate?: number | string | null;
    discountPercent?: number | string | null;
    taxPercent?: number | string | null;
  }>;
  taxType?: "cgst-sgst" | "igst" | "none";
  extraDiscountAmount?: number | string | null;
  roundOffAmount?: number | string | null;
};

export type QuotationTotals = {
  subtotal: number;
  discountTotal: number;
  taxableBeforeExtraDiscount: number;
  taxable: number;
  taxBeforeExtraDiscount: number;
  tax: number;
  roundOff: number;
  grandTotalBeforeRoundOff: number;
  grandTotal: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  extraDiscountAmount: number;
};

export function calculateQuotationTotals({
  items,
  taxType = "cgst-sgst",
  extraDiscountAmount = 0,
  roundOffAmount = 0,
}: QuotationTotalsInput): QuotationTotals {
  const normalizedItems = items.map((item) => ({
    qty: Number(item.qty || 0),
    rate: Number(item.rate || 0),
    discountPercent: Number(item.discountPercent || 0),
    taxPercent: Number(item.taxPercent || 0),
  }));

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const discountTotal = normalizedItems.reduce((sum, item) => {
    const lineTotal = item.qty * item.rate;
    return sum + (lineTotal * item.discountPercent) / 100;
  }, 0);

  const taxableBeforeExtraDiscount = Math.max(subtotal - discountTotal, 0);
  const extraDiscount = Number(extraDiscountAmount || 0);
  const taxable = Math.max(taxableBeforeExtraDiscount - extraDiscount, 0);
  const roundOff = Number(roundOffAmount || 0);

  const taxBeforeExtraDiscount = normalizedItems.reduce((sum, item) => {
    const lineTotal = item.qty * item.rate;
    const discountValue = (lineTotal * item.discountPercent) / 100;
    const discountedValue = lineTotal - discountValue;
    return sum + (discountedValue * item.taxPercent) / 100;
  }, 0);

  const tax =
    taxableBeforeExtraDiscount > 0
      ? (taxBeforeExtraDiscount / taxableBeforeExtraDiscount) * taxable
      : 0;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (taxType === "cgst-sgst") {
    cgst = tax / 2;
    sgst = tax / 2;
  } else if (taxType === "igst") {
    igst = tax;
  }

  const grandTotalBeforeRoundOff = taxable + tax;
  const grandTotal = grandTotalBeforeRoundOff + roundOff;

  const defaultTaxPercent =
    normalizedItems.reduce((sum, item) => sum + item.taxPercent, 0) / Math.max(normalizedItems.length, 1);
  const cgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
  const sgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
  const igstRate = taxType === "igst" ? defaultTaxPercent : 0;

  return {
    subtotal,
    discountTotal,
    taxableBeforeExtraDiscount,
    taxable,
    taxBeforeExtraDiscount,
    tax,
    roundOff,
    grandTotalBeforeRoundOff,
    grandTotal,
    cgstRate,
    sgstRate,
    igstRate,
    cgst,
    sgst,
    igst,
    extraDiscountAmount: extraDiscount,
  };
}
