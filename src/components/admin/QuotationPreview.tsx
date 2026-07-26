
"use client";

import type { InvoiceSummary } from "@/lib/invoiceRoute";
import { calculateQuotationTotals } from "@/lib/quotationTotals";
import { useMemo, useState } from "react";

type TaxType = "cgst-sgst" | "igst" | "none";

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
  "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${ONES[n % 10] ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest > 0) parts.push(twoDigits(rest));
  return parts.join(" ");
}

function numberToIndianWords(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "Zero";

  const negative = rounded < 0;
  let n = Math.abs(rounded);

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const rest = n;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest > 0) parts.push(threeDigits(rest));

  return `${negative ? "Minus " : ""}${parts.join(" ")} Only`;
}

const formatCurrency = (value?: number) =>
  `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};

interface QuotationPreviewProps {
  partyName?: string | null;
  contactPerson?: string | null;
  gstin?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  quotationNumber?: string | null;
  quotationDate?: string | null;
  validUntil?: string | null;
  poDate?: string | null;
  poNo?: string | null;
  placeOfSupply?: string | null;
  ewayBillNo?: string | null;
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
  taxType?: TaxType;
  notes?: string | null;
  terms?: string | null;
  additionalDescription?: string | null;
  extraDiscountAmount?: number | string | null;
  roundOffAmount?: number | string | null;
  paymentMode?: string | null;
  authorizedSignature?: string | null;
  signatureImage?: string | null;
  convertedFromProforma?: boolean;
  sourceProformaNumber?: string | null;
  isDuplicateCopy?: boolean;
  isEditing?: boolean;
  bankDetails?: string | null;
  onTaxTypeChange?: (type: TaxType) => void;
  invoice?: InvoiceSummary;
}

export default function QuotationPreview({
  invoice,
  partyName,
  contactPerson,
  gstin,
  phone,
  email,
  address,
  city,
  state,
  pincode,
  quotationNumber,
  quotationDate,
  validUntil,
  poDate,
  poNo,
  placeOfSupply,
  ewayBillNo,
  additionalDescription,
  items = [],
  taxType: taxTypeProp,
  notes,
  terms,
  extraDiscountAmount,
  roundOffAmount,
  paymentMode,
  authorizedSignature,
  signatureImage,
  convertedFromProforma,
  bankDetails,
  onTaxTypeChange,
}: QuotationPreviewProps) {
  const effectivePartyName = partyName ?? invoice?.partyName ?? null;
  const effectiveContactPerson = contactPerson ?? invoice?.contactPerson ?? null;
  const effectiveGstin = gstin ?? invoice?.gstin ?? null;
  const effectivePhone = phone ?? invoice?.phone ?? null;
  const effectiveEmail = email ?? invoice?.email ?? null;
  const effectiveAddress = address ?? invoice?.address ?? null;
  const effectiveCity = city ?? invoice?.city ?? null;
  const effectiveState = state ?? invoice?.state ?? null;
  const effectivePincode = pincode ?? invoice?.pincode ?? null;
  const effectiveQuotationNumber = quotationNumber ?? invoice?.invoiceNumber ?? null;
  const effectiveQuotationDate = quotationDate ?? invoice?.invoiceDate ?? null;
  const effectiveValidUntil = validUntil ?? (invoice?.dueDate as string | null) ?? null;
  const effectivePoDate = poDate ?? invoice?.poDate ?? null;
  const effectivePoNo = poNo ?? invoice?.poNo ?? null;
  const effectivePlaceOfSupply = placeOfSupply ?? invoice?.placeOfSupply ?? null;
  const effectiveItems = items.length > 0 ? items : invoice?.items ?? [];
  const effectiveTaxType = taxTypeProp ?? ((invoice?.taxType as TaxType) ?? "cgst-sgst");
  const effectiveNotes = notes ?? invoice?.notes ?? null;
  const effectiveTerms = terms ?? invoice?.terms ?? null;
  const effectiveExtraDiscountAmount = extraDiscountAmount ?? invoice?.extraDiscountAmount ?? null;
  const effectiveRoundOffAmount = roundOffAmount ?? (invoice?.roundOff as number | string | null) ?? null;
  const effectivePaymentMode = paymentMode ?? invoice?.paymentMode ?? null;
  const effectiveAuthorizedSignature = authorizedSignature ?? invoice?.authorizedSignature ?? null;
  const effectiveSignatureImage = signatureImage ?? invoice?.signatureImage ?? null;
  const effectiveSignatureImageSrc = effectiveSignatureImage?.trim() ? effectiveSignatureImage : "/STAMP.jpeg";
  const effectiveConvertedFromProforma = convertedFromProforma ?? (invoice?.convertedFromProforma as boolean | undefined);
  const effectiveBankDetails = bankDetails ?? invoice?.bankDetails ?? null;

  const isInteractive = onTaxTypeChange !== undefined;
  const [internalTaxType, setInternalTaxType] = useState<TaxType>(
    effectiveTaxType || "cgst-sgst",
  );
  const taxType = taxTypeProp ?? internalTaxType;

  const roundOff = Number(effectiveRoundOffAmount || 0);
  const shouldShowDiscountColumn = effectiveItems.some((item) => Number(item.discountPercent || 0) > 0);

  const rows = useMemo(
    () =>
      effectiveItems.map((item) => {
        const rate = Number(item.rate || 0);
        const qty = Number(item.qty || 0);
        const discountPercent = Number(item.discountPercent || 0);
        const taxPercent = Number(item.taxPercent || 0);

        const taxablePerUnit = rate * (1 - discountPercent / 100);
        const taxableAmount = qty * taxablePerUnit;
        const discountAmount = qty * rate * (discountPercent / 100);
        const gstAmount = taxableAmount * (taxPercent / 100);
        const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (taxPercent / 100);
        const rowAmount = taxableAmount + gstAmount;

        return {
          ...item,
          taxablePerUnit,
          taxableAmount,
          discountAmount,
          gstAmount,
          finalRatePerUnit,
          rowAmount,
          rate,
          qty,
          discountPercent,
          taxPercent,
        };
      }),
    [effectiveItems],
  );

  const totals = useMemo(() => {
    const discountAmountVal = Number(effectiveExtraDiscountAmount || 0);

    return calculateQuotationTotals({
      items: rows.map((row) => ({
        qty: row.qty,
        rate: row.rate,
        discountPercent: row.discountPercent,
        taxPercent: row.taxPercent,
      })),
      taxType,
      extraDiscountAmount: discountAmountVal,
      roundOffAmount: roundOff,
    });
  }, [rows, taxType, effectiveExtraDiscountAmount, roundOff]);

  const handleTaxTypeChange = (value: TaxType) => {
    if (onTaxTypeChange) {
      onTaxTypeChange(value);
    } else {
      setInternalTaxType(value);
    }
  };

  const renderCompactMetricCell = (amount: number, rate: number) => {
    if (rate <= 0) return <span className="text-slate-400">—</span>;
    return (
      <span className="flex flex-col items-end leading-tight">
        <span>{formatCurrency(amount)}</span>
        <span className="text-[8px] text-slate-400">({rate.toFixed(1)}%)</span>
      </span>
    );
  };

  const docLabel = effectiveConvertedFromProforma ? "Quotation (From Proforma)" : "Quotation Invoice";
  const hasNotes = !!effectiveNotes?.trim();
  const hasTerms = !!effectiveTerms?.trim();

  const sectionHeaderClass = "bg-[#e7eef9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#294c76] border-b border-slate-300";

  return (
    <section className="invoice-preview-shell rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0" style={{ color: "#000" }}>
      <style jsx global>{`
        .invoice-preview-shell,
        .invoice-preview-shell * {
          color: #000 !important;
        }
      `}</style>
      <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border-[1.5px] border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:h-auto print:min-h-0 print:rounded-none print:border-0 print:shadow-none print:bg-white" style={{ color: "#000" }}>

        {/* Header bar */}
        <div className="relative flex items-center justify-center border-b border-slate-300 bg-white px-5 py-2.5">
          <h2 className="text-[15px] font-bold text-slate-900">Quotation</h2>
          <span className="absolute right-5 text-[10px] font-bold uppercase tracking-widest text-slate-700"></span>
        </div>

        {/* Company row */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-5 py-3">
          <div className="flex items-start gap-3">
            <img src="/favicon.png" alt="Logo" className="h-20 w-20 object-contain" />
            <div>
              <h3 className="text-[20px] font-extrabold tracking-wide text-slate-950">RADIATECH ELECTRA</h3>
              <p className="mt-0.5 text-[14px] text-black-500 leading-snug">Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301</p>
            </div>
          </div>
          <div className="text-right text-[13px] leading-5 shrink-0">
            <div>Phone: +91 81788 50959</div>
            <div>Email: sales@radiatech.in</div>
            <div>GSTIN: 09DDZPK0004H1ZF</div>
            <div>State: 09-Uttar Pradesh</div>
          </div>
        </div>

        {/* Quotation To + Quotation Details */}
        <div className="grid grid-cols-2 border-b border-slate-300">
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Quotation To:</div>
            <div className="p-3 text-[13px] leading-5 text-slate-800">
              <div className="font-semibold text-slate-900">{effectivePartyName || "—"}</div>
              {effectiveContactPerson && <div>{effectiveContactPerson}</div>}
              <div>{effectiveAddress || "—"}</div>
              <div>{[effectiveCity, effectiveState, effectivePincode].filter(Boolean).join(", ") || "—"}</div>
              <div>Contact No: {effectivePhone || "—"}</div>
              <div>Email: {effectiveEmail || "—"}</div>
              <div>GSTIN: {effectiveGstin || "—"}</div>
            </div>
          </div>
          <div>
            <div className={sectionHeaderClass}>Quotation Details:</div>
            <div className="p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px] text-slate-800">
              <span className="font-semibold text-slate-900">Quotation No:</span><span>{effectiveQuotationNumber || "—"}</span>
              <span className="font-semibold text-slate-900">Date:</span><span>{formatDate(effectiveQuotationDate ?? (invoice?.createdAt as string | null))}</span>
              <span className="font-semibold text-slate-900">PO Date:</span><span>{formatDate(effectivePoDate)}</span>
              <span className="font-semibold text-slate-900">Valid Until:</span><span>{formatDate(effectiveValidUntil)}</span>
              <span className="font-semibold text-slate-900">PO No:</span><span>{effectivePoNo || "—"}</span>
              <span className="font-semibold text-slate-900">Reference No:</span><span>{effectivePlaceOfSupply || "—"}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="invoice-table-wrap overflow-x-auto border-b border-slate-300">
          <table className="w-full table-fixed border-collapse text-[11px]">
            {shouldShowDiscountColumn ? (
              <colgroup>
                <col className="w-[3%]" />
                <col className="w-[18%]" />
                <col className="w-[7%]" />
                <col className="w-[6%]" />
                <col className="w-[5%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
              </colgroup>
            ) : (
              <colgroup>
                <col className="w-[3%]" />
                <col className="w-[20%]" />
                <col className="w-[8%]" />
                <col className="w-[6%]" />
                <col className="w-[5%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
            )}
            <thead>
              <tr className="bg-[#bec9d9] text-slate-700">
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">#</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Item name</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">HSN/SAC</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Qty</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Unit</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Price/unit</th>
                {shouldShowDiscountColumn && <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Discount</th>}
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable<br/>Price/unit</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable<br/>Amount</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">GST</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Final Rate</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Amount Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.id || index} className="odd:bg-white even:bg-slate-50/50">
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{index + 1}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top break-words whitespace-normal">{item.description || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.hsn || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{item.qty}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.unit || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.rate)}</td>
                  {shouldShowDiscountColumn && <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{renderCompactMetricCell(item.discountAmount, item.discountPercent)}</td>}
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxablePerUnit)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxableAmount)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{renderCompactMetricCell(item.gstAmount, item.taxPercent)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.finalRatePerUnit)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top font-semibold text-slate-900">{formatCurrency(item.rowAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-semibold text-slate-900 text-[11px]">
                <td className="border border-slate-300 px-1.5 py-1.5" colSpan={3}>Total</td>
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{rows.reduce((sum, row) => sum + row.qty, 0)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5" />
                {shouldShowDiscountColumn && <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.discountTotal)}</td>}
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid border-b border-slate-300" style={{ gridTemplateColumns: "1fr 280px" }}>
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Tax Summary:</div>
            <div className="p-3">
              <div className="mb-2 print:hidden">
                <span className="block mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tax Option</span>
                <select
                  value={taxType}
                  onChange={(event) => handleTaxTypeChange(event.target.value as TaxType)}
                  disabled={!isInteractive}
                  className="w-48 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 disabled:opacity-60"
                >
                  <option value="cgst-sgst">CGST + SGST</option>
                  <option value="igst">IGST</option>
                  <option value="none">No Tax</option>
                </select>
              </div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Taxable</th>
                    {taxType === "cgst-sgst" ? (
                      <>
                        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Rate)</th>
                        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Amt)</th>
                        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Rate)</th>
                        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Amt)</th>
                      </>
                    ) : taxType === "igst" ? (
                      <>
                        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Rate)</th>
                        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Amt)</th>
                      </>
                    ) : null}
                    <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-900">{formatCurrency(totals.taxable)}</td>
                    {taxType === "cgst-sgst" ? (
                      <>
                        <td className="border border-slate-300 px-2 py-1 text-right">{totals.cgstRate.toFixed(2)}%</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{totals.sgstRate.toFixed(2)}%</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
                      </>
                    ) : taxType === "igst" ? (
                      <>
                        <td className="border border-slate-300 px-2 py-1 text-right">{totals.igstRate.toFixed(2)}%</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
                      </>
                    ) : null}
                    <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
                  </tr>
                  <tr className="bg-[#e9e7e9] font-semibold text-slate-900">
                    <td className="border border-slate-300 px-2 py-1">TOTAL</td>
                    {taxType === "cgst-sgst" ? (
                      <>
                        <td className="border border-slate-300 px-2 py-1 text-right">—</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">—</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
                      </>
                    ) : taxType === "igst" ? (
                      <>
                        <td className="border border-slate-300 px-2 py-1 text-right">—</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
                      </>
                    ) : null}
                    <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-2.5 text-[11px] text-slate-700">
                <span className="font-semibold text-slate-900">Amount in Words: </span>
                {numberToIndianWords(totals.grandTotal)}
              </div>
            </div>
          </div>

          <div className="p-3 text-[12px] text-slate-800">
            {totals.discountTotal > 0 && (
              <div className="flex justify-between gap-2 mt-0.5">
                <span>Item-wise Discount</span>
                <span className="shrink-0 text-right">: {formatCurrency(totals.discountTotal)}</span>
              </div>
            )}
            {totals.extraDiscountAmount > 0 && (
              <div className="flex justify-between gap-2 mt-0.5 text-amber-700">
                <span>Discount on Taxable Amt</span>
                <span className="shrink-0 text-right">: {formatCurrency(totals.extraDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 mt-0.5">
              <span>Taxable Amount</span>
              <span className="shrink-0 text-right">: {formatCurrency(totals.extraDiscountAmount > 0 ? totals.taxable : totals.taxableBeforeExtraDiscount)}</span>
            </div>
            <div className="flex justify-between gap-2 mt-0.5">
              <span>Tax</span>
              <span className="shrink-0 text-right">: {formatCurrency(totals.tax)}</span>
            </div>
            {Math.abs(totals.roundOff) > 0 && (
              <div className="flex justify-between gap-2 mt-0.5">
                <span>Round Off</span>
                <span className="shrink-0 text-right">: {formatCurrency(totals.roundOff)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-slate-300 text-[14px] font-bold text-slate-950">
              <span>Grand Total</span>
              <span className="shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
            </div>
            <div className="flex justify-between gap-2 mt-2">
              <span>Payment Mode</span>
              <span className="shrink-0 text-right">: {effectivePaymentMode || "—"}</span>
            </div>
            <div className="flex justify-between gap-2 mt-0.5 font-semibold text-slate-900">
              <span>Balance</span>
              <span className="shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {(hasNotes || hasTerms) && (
          <div className="grid grid-cols-1 border-b border-slate-300 print:grid-cols-2 md:grid-cols-2">
            {hasNotes && (
              <div className={`border-b border-slate-300 ${hasTerms ? "md:border-r print:border-r" : ""}`}>
                <div className={sectionHeaderClass}>Notes</div>
                <div className="px-4 py-2.5 text-[12px] leading-5 text-slate-700 whitespace-pre-line">
                  {effectiveNotes || "—"}
                </div>
              </div>
            )}
            {hasTerms && (
              <div className="border-b border-slate-300">
                <div className={sectionHeaderClass}>Terms &amp; Conditions</div>
                <div className="px-4 py-2.5 text-[12px] leading-5 text-slate-700 whitespace-pre-line">
                  {effectiveTerms || "—"}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2">
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Bank Details:</div>
            <div className="p-3 whitespace-pre-line text-[12px] text-slate-700 leading-5">
              {effectiveBankDetails || "—"}
            </div>
          </div>
          <div>
            <div className={`${sectionHeaderClass} text-right`}>For Radiatech Electra:</div>
            <div className="p-3 flex flex-col items-end">
              <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                {effectiveSignatureImageSrc ? (
                  <img src={effectiveSignatureImageSrc} alt="Signature" className="h-full w-full object-contain" />
                ) : "Signature"}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-700 text-center">
                {effectiveAuthorizedSignature || "Authorized Signatory"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
