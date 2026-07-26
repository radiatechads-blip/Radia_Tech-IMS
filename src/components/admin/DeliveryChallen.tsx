
"use client";

import type { InvoiceSummary } from "@/lib/invoiceRoute";
import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
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
  challanNo?: string | null;
  shipToAddress?: string | null;
  shipToCity?: string | null;
  shipToState?: string | null;
  shipToPincode?: string | null;
  transportName?: string | null;
  vehicleNumber?: string | null;
  receivedByName?: string | null;
  receivedByComment?: string | null;
  receivedByDate?: string | null;
  receivedBySignature?: string | null;
  deliveredByName?: string | null;
  deliveredByComment?: string | null;
  deliveredByDate?: string | null;
  deliveredBySignature?: string | null;
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
  pageLabels?: string[];
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
  challanNo,
  shipToAddress,
  shipToCity,
  shipToState,
  shipToPincode,
  transportName,
  vehicleNumber,
  receivedByName,
  receivedByComment,
  receivedByDate,
  receivedBySignature,
  deliveredByName,
  deliveredByComment,
  deliveredByDate,
  deliveredBySignature,
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
  pageLabels,
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
  const effectiveChallanNo = challanNo ?? quotationNumber ?? invoice?.invoiceNumber ?? null;
  const effectiveShipToAddress = shipToAddress ?? effectiveAddress ?? null;
  const effectiveShipToCity = shipToCity ?? effectiveCity ?? null;
  const effectiveShipToState = shipToState ?? effectiveState ?? null;
  const effectiveShipToPincode = shipToPincode ?? effectivePincode ?? null;
  const record = invoice as (InvoiceSummary & Record<string, unknown>) | undefined;
  const effectiveTransportName = transportName ?? invoice?.transportName ?? null;
  const effectiveVehicleNumber = vehicleNumber ?? invoice?.vehicleNumber ?? null;
  const effectiveReceivedByName = receivedByName ?? (record?.receivedByName as string | null | undefined) ?? null;
  const effectiveReceivedByComment = receivedByComment ?? (record?.receivedByComment as string | null | undefined) ?? null;
  const effectiveReceivedByDate = receivedByDate ?? (record?.receivedByDate as string | null | undefined) ?? null;
  const effectiveReceivedBySignature = receivedBySignature ?? (record?.receivedBySignature as string | null | undefined) ?? null;
  const effectiveDeliveredByName = deliveredByName ?? (record?.deliveredByName as string | null | undefined) ?? null;
  const effectiveDeliveredByComment = deliveredByComment ?? (record?.deliveredByComment as string | null | undefined) ?? null;
  const effectiveDeliveredByDate = deliveredByDate ?? (record?.deliveredByDate as string | null | undefined) ?? null;
  const effectiveDeliveredBySignature = deliveredBySignature ?? (record?.deliveredBySignature as string | null | undefined) ?? null;
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
    const subtotal = rows.reduce((sum, r) => sum + r.qty * r.rate, 0);
    const discountTotal = rows.reduce((sum, r) => sum + r.discountAmount, 0);
    const taxableBeforeExtraDiscount = rows.reduce((sum, r) => sum + r.taxableAmount, 0);
    const taxBeforeExtraDiscount = rows.reduce((sum, r) => sum + r.gstAmount, 0);

    const discountAmountVal = Number(effectiveExtraDiscountAmount || 0);
    const taxable = discountAmountVal > 0 ? Math.max(0, taxableBeforeExtraDiscount - discountAmountVal) : taxableBeforeExtraDiscount;
    const tax =
      discountAmountVal > 0
        ? rows.reduce((sum, r) => {
            const ratio = taxableBeforeExtraDiscount > 0 ? r.taxableAmount / taxableBeforeExtraDiscount : 0;
            return sum + r.gstAmount * ratio;
          }, 0)
        : taxBeforeExtraDiscount;

    const grandTotalBeforeRoundOff = taxable + tax;
    const grandTotal = grandTotalBeforeRoundOff + roundOff;

    const cgstRate = taxType === "cgst-sgst" && rows.length > 0 ? Number(rows[0].taxPercent || 0) / 2 : 0;
    const sgstRate = cgstRate;
    const igstRate = taxType === "igst" && rows.length > 0 ? Number(rows[0].taxPercent || 0) : 0;

    const cgst = tax / 2;
    const sgst = tax / 2;
    const igst = tax;

    return {
      subtotal,
      discountTotal,
      taxableBeforeExtraDiscount,
      taxBeforeExtraDiscount,
      extraDiscountAmount: discountAmountVal,
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

  const docLabel = "Delivery Challan";
  const labels = (pageLabels && pageLabels.length > 0 ? pageLabels : [docLabel]).map((l) => l || docLabel);
  const hasNotes = !!effectiveNotes?.trim();
  const hasTerms = !!effectiveTerms?.trim();

  const sectionHeaderClass = "bg-[#e7eef9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#294c76] border-b border-slate-300";

  return (
    <div>
      {labels.map((label, labelIndex) => (
        <section key={`${label}-${labelIndex}`} className={`invoice-preview-shell rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0 ${labelIndex > 0 ? "mt-6 pt-6 print:mt-0 print:pt-0" : ""}`} style={labelIndex > 0 ? { breakBefore: "page", pageBreakBefore: "always" } : undefined}>
          <style jsx global>{`
            .invoice-preview-shell,
            .invoice-preview-shell * {
              color: #000 !important;
            }
          `}</style>
          <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border-[1.5px] border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:h-auto print:min-h-0 print:rounded-none print:border-0 print:shadow-none print:bg-white" style={{ color: "#000" }}>

            {/* Header bar */}
            <div className="relative flex items-center justify-center border-b border-slate-300 bg-white px-5 py-2.5">
              <h2 className="text-[15px] font-bold text-slate-900">{docLabel}</h2>
              <span className="absolute right-5 text-[10px] font-bold uppercase tracking-widest text-slate-700">{label}</span>
            </div>

        {/* Company row */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-5 py-3">
          <div className="flex items-start gap-3">
            <img src="/favicon.png" alt="Logo" className="h-20 w-20 object-contain" />
            <div>
              <h3 className="text-[20px] font-extrabold tracking-wide text-slate-950">RADIATECH ELECTRA</h3>
              <p className="mt-0.5 text-[14px] text-slate-500 leading-snug">Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301</p>
            </div>
          </div>
          <div className="text-right text-[13px] leading-5 shrink-0">
            <div>Phone: +91 81788 50959</div>
            <div>Email: sales@radiatech.in</div>
            <div>GSTIN: 09DDZPK0004H1ZF</div>
            <div>State: 09-Uttar Pradesh</div>
          </div>
        </div>

        {/* Delivery Challan For + Challan Details */}
        <div className="grid grid-cols-2 border-b border-slate-300">
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Delivery Challan For:</div>
            <div className="p-3 text-[13px] leading-5 text-slate-800">
              <div className="font-semibold text-slate-900">{effectivePartyName || "—"}</div>
              <div>{[effectiveAddress, effectiveCity, effectiveState, effectivePincode].filter(Boolean).join(", ") || "—"}</div>
              <div className="mt-0.5 flex flex-wrap gap-x-4">
                <span>Contact No.: <span className="font-semibold text-slate-900">{effectivePhone || "—"}</span></span>
                <span>Email: <span className="font-semibold text-slate-900">{effectiveEmail || "—"}</span></span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-4">
                <span>GSTIN: <span className="font-semibold text-slate-900">{effectiveGstin || "—"}</span></span>
                <span>State: <span className="font-semibold text-slate-900">{effectiveState || "—"}</span></span>
              </div>
            </div>
          </div>
          <div>
            <div className={sectionHeaderClass}>Challan Details:</div>
              <div className="p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px] text-slate-800">
              <span className="font-semibold text-slate-900">Challan No.:</span><span>{getDuplicateCopyInvoiceNumber(String(effectiveChallanNo ?? ""), false) || "—"}</span>
              <span className="font-semibold text-slate-900">Date:</span><span>{formatDate(effectiveQuotationDate ?? (invoice?.createdAt as string | null))}</span>
              <span className="font-semibold text-slate-900">Place Of Supply:</span><span>{effectivePlaceOfSupply || "—"}</span>
            </div>
          </div>
        </div>

        {/* Ship To + Transportation Details */}
        <div className="grid grid-cols-2 border-b border-slate-300">
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Ship To:</div>
            <div className="p-3 text-[13px] leading-5 text-slate-800">
              <div>{[effectiveShipToAddress, effectiveShipToCity, effectiveShipToState, effectiveShipToPincode].filter(Boolean).join(", ") || "—"}</div>
            </div>
          </div>
          <div>
            <div className={sectionHeaderClass}>Transportation Details:</div>
            <div className="p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px] text-slate-800">
              <span className="font-semibold text-slate-900">Transport Name:</span><span>{effectiveTransportName || ""}</span>
              <span className="font-semibold text-slate-900">Vehicle Number:</span><span>{effectiveVehicleNumber || ""}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="invoice-table-wrap overflow-x-auto border-b border-slate-300">
          <table className="w-full table-fixed border-collapse text-[12px]">
            <colgroup>
              <col className="w-[6%]" />
              <col className="w-[46%]" />
              <col className="w-[18%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#bec9d9] text-slate-700">
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold">#</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold">Item name</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold">HSN/ SAC</th>
                <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Quantity</th>
                <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Unit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.id || index} className="odd:bg-white even:bg-slate-50/50">
                  <td className="border border-slate-300 px-2 py-1.5 align-top">{index + 1}</td>
                  <td className="border border-slate-300 px-2 py-1.5 align-top break-words whitespace-normal font-semibold text-slate-900">{item.description || "—"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 align-top">{item.hsn || "—"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right align-top">{item.qty}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right align-top">{item.unit || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-semibold text-slate-900 text-[12px]">
                <td className="border border-slate-300 px-2 py-1.5" colSpan={3}>Total</td>
                <td className="border border-slate-300 px-2 py-1.5 text-right">{rows.reduce((sum, row) => sum + row.qty, 0)}</td>
                <td className="border border-slate-300 px-2 py-1.5" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms & Conditions */}
        <div className="border-b border-slate-300">
          <div className={sectionHeaderClass}>Terms &amp; Conditions:</div>
          <div className="px-4 py-2.5 text-[12px] leading-5 text-slate-700 whitespace-pre-line">
            {effectiveTerms || "Thank you for doing business with us."}
          </div>
        </div>

        {/* Received By / Delivered By / For Radiatech Electra */}
        <div className="grid grid-cols-3">
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Received By:</div>
            <div className="p-3 text-[12px] leading-6 text-slate-700">
              <div>Name: {effectiveReceivedByName || "—"}</div>
              <div>Comment: {effectiveReceivedByComment || "—"}</div>
              <div>Date: {formatDate(effectiveReceivedByDate)}</div>
              <div>Signature: {effectiveReceivedBySignature || "—"}</div>
            </div>
          </div>
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Delivered By:</div>
            <div className="p-3 text-[12px] leading-6 text-slate-700">
              <div>Name: {effectiveDeliveredByName || "—"}</div>
              <div>Comment: {effectiveDeliveredByComment || "—"}</div>
              <div>Date: {formatDate(effectiveDeliveredByDate)}</div>
              <div>Signature: {effectiveDeliveredBySignature || "—"}</div>
            </div>
          </div>
          <div>
            <div className={sectionHeaderClass}>For Radiatech Electra:</div>
            <div className="p-3 flex flex-col items-center justify-center">
              <div className="flex h-16 w-32 items-center justify-center overflow-hidden text-[11px] text-slate-400">
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
      ))}
    </div>
  );
}