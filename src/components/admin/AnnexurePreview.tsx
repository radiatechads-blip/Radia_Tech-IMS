"use client";

import type { InvoiceSummary } from "@/lib/invoiceRoute";
import { getBillTypeLabel } from "@/lib/invoiceRoute";
import { useMemo, useState } from "react";

type TaxType = "cgst-sgst" | "igst" | "none";

type AnnexureLikeInvoice = InvoiceSummary & {
  annexureNumber?: string | null;
  annexureDate?: string | null;
  additionalDescription?: string | null;
  attachedImage?: string | null;
  attachedDocument?: { name?: string; dataUrl?: string } | string | null;
};

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${ONES[n % 10] ? ` ${ONES[n % 10]}` : ""}`;
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

interface AnnexurePreviewProps {
  invoice: InvoiceSummary;
  taxType?: TaxType;
  onTaxTypeChange?: (type: TaxType) => void;
}

export default function AnnexurePreview({
  invoice,
  taxType: taxTypeProp,
  onTaxTypeChange,
}: AnnexurePreviewProps) {
  const isInteractive = onTaxTypeChange !== undefined;
  const [internalTaxType, setInternalTaxType] = useState<TaxType>(
    (invoice.taxType as TaxType) || "cgst-sgst",
  );
  const taxType = taxTypeProp ?? internalTaxType;

  const items = useMemo(() => invoice.items || [], [invoice.items]);
  const roundOff = Number(invoice.roundOff ?? 0);

  const shouldShowDiscountColumn = items.some(
    (item) => Number(item.discountPercent || 0) > 0,
  );

  const rows = useMemo(
    () =>
      items.map((item) => {
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
    [items],
  );

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, row) => sum + row.qty * row.rate, 0);
    const discountTotal = rows.reduce((sum, row) => sum + row.discountAmount, 0);
    const taxableBeforeExtraDiscount = rows.reduce((sum, row) => sum + row.taxableAmount, 0);
    const taxBeforeExtraDiscount = rows.reduce((sum, row) => sum + row.gstAmount, 0);

    const extraDiscountAmount = Number(invoice.extraDiscountAmount || 0);
    const taxable =
      extraDiscountAmount > 0
        ? Math.max(0, taxableBeforeExtraDiscount - extraDiscountAmount)
        : taxableBeforeExtraDiscount;
    const tax =
      extraDiscountAmount > 0
        ? rows.reduce((sum, row) => {
            const ratio =
              taxableBeforeExtraDiscount > 0 ? row.taxableAmount / taxableBeforeExtraDiscount : 0;
            return sum + row.gstAmount * ratio;
          }, 0)
        : taxBeforeExtraDiscount;

    const grandTotalBeforeRoundOff = taxable + tax;
    const grandTotal = grandTotalBeforeRoundOff + roundOff;

    const cgstRate =
      taxType === "cgst-sgst"
        ? rows.length > 0
          ? Number(rows[0].taxPercent || 0) / 2
          : 0
        : 0;
    const sgstRate = cgstRate;
    const igstRate =
      taxType === "igst"
        ? rows.length > 0
          ? Number(rows[0].taxPercent || 0)
          : 0
        : 0;

    const cgst = tax / 2;
    const sgst = tax / 2;
    const igst = tax;

    return {
      subtotal,
      discountTotal,
      taxableBeforeExtraDiscount,
      taxBeforeExtraDiscount,
      extraDiscountAmount,
      taxable,
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
    };
  }, [rows, taxType, invoice.extraDiscountAmount, roundOff]);

  const handleTaxTypeChange = (value: TaxType) => {
    if (onTaxTypeChange) {
      onTaxTypeChange(value);
    } else {
      setInternalTaxType(value);
    }
  };

  // metric cell rendering follows the compact stacked layout style
  const renderCompactMetricCell = (amount: number, rate: number) => {
    if (rate <= 0) return <span className="text-slate-400">—</span>;
    return (
      <span className="flex flex-col items-end leading-tight">
        <span>{formatCurrency(amount)}</span>
        <span className="text-[9px] text-slate-400">({rate.toFixed(2)}%)</span>
      </span>
    );
  };

  const docLabel = getBillTypeLabel(invoice);
  const signatureImageSrc = invoice.signatureImage?.trim() ? invoice.signatureImage : "/STAMP.jpeg";
  const annexureData = invoice as AnnexureLikeInvoice;
  const annexureNumber = String(annexureData.annexureNumber ?? invoice.invoiceNumber ?? "").trim();
  const annexureDate = String(annexureData.annexureDate ?? invoice.invoiceDate ?? "").trim();
  const additionalDescription = String(annexureData.additionalDescription ?? "").trim();
  const attachedImage = annexureData.attachedImage ? String(annexureData.attachedImage) : "";
  const attachedDocument = annexureData.attachedDocument;
  const attachedDocumentName =
    typeof attachedDocument === "object" && attachedDocument !== null
      ? String((attachedDocument as { name?: string }).name || "Attachment")
      : typeof attachedDocument === "string"
        ? attachedDocument
        : "";
  const attachedDocumentUrl =
    typeof attachedDocument === "object" && attachedDocument !== null
      ? String((attachedDocument as { dataUrl?: string }).dataUrl || "")
      : "";

  const hasAdditionalDetails = Boolean(additionalDescription || attachedImage || attachedDocumentName || attachedDocumentUrl);
  const hasNotesOrTerms = Boolean(String(invoice.notes || "").trim() || String(invoice.terms || "").trim());
  const hasNotes = !!invoice.notes?.trim();
  const hasTerms = !!invoice.terms?.trim();

  /* ─── section header cell style (matches InvoicePreview) ─── */
  const secHeader = "bg-[#e7eef9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#294c76] border-b border-slate-300";

  return (
    <section className="invoice-preview-shell rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm print:border-none print:bg-white print:shadow-none print:p-0">
      <div className="mx-auto w-full max-w-[900px] overflow-hidden border border-black bg-white text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:min-h-[297mm] print:shadow-none">

        {/* ── Header bar ── */}
        <div className="relative flex items-center justify-center border-b border-slate-300 bg-white px-5 py-2.5">
          <div className="text-center">
            <h2 className="text-[15px] font-bold text-slate-900">{docLabel}</h2>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Prepared for {invoice.partyName || "customer"}
            </p>
          </div>
          <span className="absolute right-5 text-[10px] font-bold uppercase tracking-widest text-slate-700">
            Original
          </span>
        </div>

        {/* ── Company row ── */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-5 py-3">
          <div className="flex items-start gap-3">
            <img src="/favicon.png" alt="Logo" className="h-20 w-20 object-contain" />
            <div>
              <h3 className="text-[20px] font-extrabold tracking-wide text-slate-950">RADIATECH ELECTRA</h3>
              <p className="mt-0.5 text-[14px] text-slate-500 leading-snug">
                Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
              </p>
            </div>
          </div>
          <div className="text-right text-[13px] text-slate-600 leading-5 shrink-0">
            <div>Phone: +91 81788 50959</div>
            <div>Email: sales@radiatech.in</div>
            <div>GSTIN: 09DDZPK0004H1ZF</div>
            <div>State: 09-Uttar Pradesh</div>
          </div>
        </div>

        {/* ── Party Details | Document Details ── */}
        <div className="grid grid-cols-2 border-b border-slate-300">
          <div className="border-r border-slate-300">
            <div className={secHeader}>Party Details</div>
            <div className="p-3 text-[13px] leading-5 text-slate-800">
              <div className="font-semibold text-slate-900">{invoice.partyName || "—"}</div>
              {invoice.contactPerson && <div> {invoice.contactPerson}</div>}
              <div>{invoice.address || "—"}</div>
              <div>{[invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(", ") || "—"}</div>
              <div>Contact No: {invoice.phone || "—"}</div>
              <div>Email: {invoice.email || "—"}</div>
              <div>GSTIN: {invoice.gstin || "—"}</div>
            </div>
          </div>
          <div>
            <div className={secHeader}>Document Details</div>
            <div className="p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px] text-slate-800">
              <span className="font-semibold text-slate-900">Document No:</span>
              <span>{annexureNumber || invoice.invoiceNumber || "—"}</span>
              <span className="font-semibold text-slate-900">Date:</span>
              <span>{formatDate(annexureDate || invoice.invoiceDate || invoice.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* ── Items table ── */}
        <div className="invoice-table-wrap overflow-x-auto border-b border-slate-300">
          <table className="w-full table-fixed border-collapse text-[11px]">
            {shouldShowDiscountColumn ? (
              <colgroup>
                <col className="w-[3%]" /><col className="w-[18%]" /><col className="w-[7%]" />
                <col className="w-[6%]" /><col className="w-[5%]" /><col className="w-[8%]" />
                <col className="w-[8%]" /><col className="w-[8%]" /><col className="w-[9%]" />
                <col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[10%]" />
              </colgroup>
            ) : (
              <colgroup>
                <col className="w-[3%]" /><col className="w-[20%]" /><col className="w-[8%]" />
                <col className="w-[6%]" /><col className="w-[5%]" /><col className="w-[9%]" />
                <col className="w-[9%]" /><col className="w-[10%]" /><col className="w-[10%]" />
                <col className="w-[10%]" /><col className="w-[10%]" />
              </colgroup>
            )}
            <thead>
              <tr className="bg-[#bec9d9] text-slate-700">
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">#</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Item name</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">HSN/SAC</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Quantity</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Unit</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Price/unit (Rs)</th>
                {shouldShowDiscountColumn && (
                  <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Discount</th>
                )}
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable Price/unit (Rs)</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable amount (Rs)</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">GST</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Final Rate (Rs)</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Amount Total (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.id || index} className="odd:bg-white even:bg-slate-50/50">
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{index + 1}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top break-words whitespace-normal">{item.description || "Item description"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.hsn || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{item.qty}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.unit || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.rate)}</td>
                  {shouldShowDiscountColumn && (
                    <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">
                      {renderCompactMetricCell(item.discountAmount, item.discountPercent)}
                    </td>
                  )}
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">
                    {formatCurrency(item.taxablePerUnit)}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">
                    {formatCurrency(item.taxableAmount)}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">
                    {renderCompactMetricCell(item.gstAmount, item.taxPercent)}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">
                    {formatCurrency(item.finalRatePerUnit)}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top font-semibold text-slate-900">
                    {formatCurrency(item.rowAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-semibold text-slate-900 text-[11px]">
                <td className="border border-slate-300 px-1.5 py-1.5" colSpan={3}>Total</td>
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{rows.reduce((sum, item) => sum + item.qty, 0)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5" />
                {shouldShowDiscountColumn && (
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.discountTotal)}</td>
                )}
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">
                  {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Tax Summary | Totals ── */}
        <div className="invoice-card grid border-b border-slate-300" style={{ gridTemplateColumns: "1fr 280px" }}>
          {/* Tax Summary left */}
          <div className="border-r border-slate-300">
            <div className={secHeader}>Tax Summary</div>
            <div className="p-3">
              {/* Tax Option selector (screen only) */}
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

              {/* Tax table */}
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

          {/* Totals right */}
          <div className="p-3 text-[12px] text-slate-800">
            {totals.discountTotal > 0 && (
              <div className="flex justify-between gap-2 mt-0.5">
                <span>Item-wise Discount</span>
                <span className="shrink-0 text-right">: {formatCurrency(totals.discountTotal)}</span>
              </div>
            )}
            {totals.extraDiscountAmount > 0 && (
              <div className="flex justify-between gap-2 mt-0.5 text-amber-700">
                <span>Discount on Taxable Amount</span>
                <span className="shrink-0 text-right">: {formatCurrency(totals.extraDiscountAmount)}</span>
              </div>
            )}
            {totals.extraDiscountAmount > 0 ? (
              <div className="flex justify-between gap-2 mt-0.5">
                <span>Taxable Amount (After Extra Discount)</span>
                <span className="shrink-0 text-right">: {formatCurrency(totals.taxable)}</span>
              </div>
            ) : (
              <div className="flex justify-between gap-2 mt-0.5">
                <span>Taxable Amount</span>
                <span className="shrink-0 text-right">: {formatCurrency(totals.taxableBeforeExtraDiscount)}</span>
              </div>
            )}
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
              <span className="shrink-0 text-right">: {invoice.paymentMode || "—"}</span>
            </div>
            <div className="flex justify-between gap-2 mt-0.5 font-semibold text-slate-900">
              <span>Balance</span>
              <span className="shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Notes & Terms ── */}
        
        {/* ── Reference | Signature ── */}
        <div className="grid grid-cols-2">
          <div className="border-r border-slate-300">
            <div className={secHeader}>Reference:</div>
            <div className="p-3 text-[12px] leading-5 text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Annexure No:</span>{" "}
                {annexureNumber || invoice.invoiceNumber || "—"}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Annexure Date:</span>{" "}
                {formatDate(annexureDate || invoice.invoiceDate || invoice.createdAt)}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Prepared For:</span> {invoice.partyName || "—"}
              </div>
            </div>
          </div>
          <div>
            <div className={`${secHeader} text-right`}>For Radiatech Electra:</div>
            <div className="invoice-card p-3 flex flex-col items-end">
              <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                {signatureImageSrc ? (
                  <img src={signatureImageSrc} alt="Authorized signature" className="h-full w-full object-contain" />
                ) : (
                  "Signature"
                )}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-700 text-center">
                {invoice.authorizedSignature || "Authorized Signatory"}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 6mm;
        }

        @media print {
          html,
          body {
            width: 210mm !important;
            height: 297mm !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .invoice-preview-shell,
          .invoice-preview-shell * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-preview-shell {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .invoice-preview-shell > div {
            width: 100% !important;
            max-width: none !important;
            min-height: 285mm !important;
            box-shadow: none !important;
            border: 1.2px solid #000 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .invoice-preview-shell .invoice-card,
          .invoice-preview-shell .invoice-table-wrap {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}