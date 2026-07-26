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
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  const parts: string[] = [];
  if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest > 0) parts.push(threeDigits(rest));
  return `${negative ? "Minus " : ""}${parts.join(" ")} Only`;
}

const fmt = (value?: number) =>
  `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const fmtDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN");
};

export interface InvoiceItem {
  id?: string | number | null;
  description?: string | null;
  hsn?: string | null;
  qty?: number | string | null;
  unit?: string | null;
  rate?: number | string | null;
  discountPercent?: number | string | null;
  taxPercent?: number | string | null;
}

export interface InvoiceSummary {
  billType?: string | null;
  partyName?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  createdAt?: string | null;
  poDate?: string | null;
  ewayBillNo?: string | null;
  poNo?: string | null;
  placeOfSupply?: string | null;
  shipToAddress?: string | null;
  transportName?: string | null;
  vehicleNumber?: string | null;
  taxType?: string | null;
  extraDiscountAmount?: number | string | null;
  roundOff?: number | string | null;
  subtotal?: number | string | null;
  discountTotal?: number | string | null;
  taxableAmount?: number | string | null;
  taxAmount?: number | string | null;
  grandTotal?: number | string | null;
  paymentMode?: string | null;
  notes?: string | null;
  terms?: string | null;
  bankDetails?: string | null;
  signatureImage?: string | null;
  authorizedSignature?: string | null;
  items?: InvoiceItem[];
}

interface Props {
  invoice: InvoiceSummary;
  taxType?: TaxType;
  pageLabels?: string[];
  onTaxTypeChange?: (type: TaxType) => void;
}

export default function CNPreview({ invoice, taxType: taxTypeProp, pageLabels, onTaxTypeChange }: Props) {
  const isInteractive = onTaxTypeChange !== undefined;
  const [internalTaxType, setInternalTaxType] = useState<TaxType>(
    (invoice.taxType as TaxType) || "cgst-sgst",
  );
  const taxType = taxTypeProp ?? internalTaxType;

  const items = useMemo(() => invoice.items || [], [invoice.items]);
  const showDiscount = items.some((item) => Number(item.discountPercent || 0) > 0);

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
        const finalRatePerUnit = taxablePerUnit * (1 + taxPercent / 100);
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
    const subtotal = rows.reduce((s, r) => s + (Number(r.rate || 0) * Number(r.qty || 0)), 0);
    const discountTotal = rows.reduce((s, r) => s + Number(r.discountAmount || 0), 0);
    const taxableBeforeExtra = Math.max(subtotal - discountTotal, 0);
    const extraDiscount = Number(invoice.extraDiscountAmount || 0);
    const taxable = Math.max(taxableBeforeExtra - extraDiscount, 0);
    const roundOffVal = Number(invoice.roundOff || 0);
    const taxBeforeExtra = rows.reduce((s, r) => s + Number(r.gstAmount || 0), 0);
    const tax = taxableBeforeExtra > 0 ? (taxBeforeExtra / taxableBeforeExtra) * taxable : 0;
    const defaultTaxPercent = rows.length > 0 ? rows.reduce((s, r) => s + Number(r.taxPercent || 0), 0) / rows.length : 0;
    const cgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
    const sgstRate = cgstRate;
    const igstRate = taxType === "igst" ? defaultTaxPercent : 0;
    const cgst = taxType === "cgst-sgst" ? tax / 2 : 0;
    const sgst = cgst;
    const igst = taxType === "igst" ? tax : 0;
    const grandTotal = taxable + tax + roundOffVal;
    const storedDiscountTotal = Number(invoice.discountTotal ?? 0);
    const storedTaxable = Number(invoice.taxableAmount ?? 0);
    const storedTax = Number(invoice.taxAmount ?? 0);
    const storedGrand = Number(invoice.grandTotal ?? 0);

    return {
      discountTotal: storedDiscountTotal > 0 ? storedDiscountTotal : discountTotal,
      taxableBeforeExtra,
      taxBeforeExtra,
      extraDiscount,
      taxable: storedTaxable > 0 ? storedTaxable : taxable,
      tax: storedTax > 0 ? storedTax : tax,
      roundOff: roundOffVal,
      grandTotal: storedGrand > 0 ? storedGrand : grandTotal,
      cgstRate,
      sgstRate,
      igstRate,
      cgst,
      sgst,
      igst,
    };
  }, [rows, taxType, invoice.extraDiscountAmount, invoice.discountTotal, invoice.taxableAmount, invoice.taxAmount, invoice.grandTotal, invoice.roundOff]);

  const handleTaxChange = (value: TaxType) => {
    if (onTaxTypeChange) {
      onTaxTypeChange(value);
      return;
    }
    setInternalTaxType(value);
  };

  const metricCell = (amount: number, rate: number) => {
    if (rate <= 0) return <span className="text-black">—</span>;
    return (
      <span className="flex flex-col items-end leading-tight">
        <span>{fmt(amount)}</span>
        <span className="text-[9px] text-black">({rate.toFixed(2)}%)</span>
      </span>
    );
  };

  const docLabel = invoice.billType || "Debit Note";
  const hasNotes = !!invoice.notes?.trim();
  const hasTerms = !!invoice.terms?.trim();
  const labels = (pageLabels && pageLabels.length > 0 ? pageLabels : [docLabel]).map((label) => label || "Debit Note");
  const secHeader = "bg-[#e7eef9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black border-b border-slate-300";

  return (
    <div className="invoice-preview-shell mx-auto w-full">
      <div className="overflow-hidden border-[1.2px] border-slate-300 bg-white text-black print:border-[1px]">
        {labels.map((label, index) => (
          <section key={`${label}-${index}`} className={`invoice-preview-page ${index > 0 ? "mt-6 border-t border-dashed border-slate-300 pt-6 print:mt-0 print:border-t-0 print:pt-0" : ""}`} style={index > 0 ? { breakBefore: "page", pageBreakBefore: "always" } : undefined}>
            <div className="relative flex items-center justify-center border-b border-slate-300 bg-[#f7f9fc] px-6 py-3">
              <h2 className="text-base font-semibold text-black">Credit Note</h2>
              <span className="absolute right-6 text-[11px] font-semibold uppercase tracking-wide text-black">{label}</span>
            </div>
            <div className="border-b border-slate-300 bg-white px-5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img src="/favicon.png" alt="Logo" className="h-16 w-16 object-contain" />
                  <div>
                    <h3 className="text-[18px] font-extrabold tracking-wide text-black">RADIATECH ELECTRA</h3>
                    <p className="mt-0.5 text-[12px] leading-5 text-black">
                      Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
                    </p>
                  </div>
                </div>
                <div className="text-right text-[12px] leading-5 text-black">
                  <div>Phone: +91 81788 50959</div>
                  <div>Email: sales@radiatech.in</div>
                  <div>GSTIN: 09DDZPK0004H1ZF</div>
                  <div>State: 09-Uttar Pradesh</div>
                </div>
              </div>
            </div>

            <div className="grid border-b border-slate-300 md:grid-cols-2">
              <div className="border-b border-slate-300 md:border-b-0 md:border-r">
                <div className={secHeader}>Return From:</div>
                <div className="p-3 text-[13px] leading-5 text-black">
                  <div className="font-semibold text-black">{invoice.partyName || "—"}</div>
                  {invoice.contactPerson && <div>{invoice.contactPerson}</div>}
                  <div>{invoice.address || "—"}</div>
                  <div>{[invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(", ") || "—"}</div>
                  <div>Contact No: {invoice.phone || "—"}</div>
                  <div>Email: {invoice.email || "—"}</div>
                  <div>GSTIN: {invoice.gstin || "—"}</div>
                </div>
              </div>
              <div>
                <div className={secHeader}>Return Details:</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-3 text-[13px] text-black">
                  <span className="font-semibold text-black">Return No:</span><span>{getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, false) || "—"}</span>
                  <span className="font-semibold text-black">Date:</span><span>{fmtDate(invoice.invoiceDate || invoice.createdAt)}</span>
                  <span className="font-semibold text-black">Bill Date:</span><span>{fmtDate(invoice.poDate)}</span>
                  <span className="font-semibold text-black">Bill No:</span><span>{invoice.poNo || "—"}</span>
                  <span className="font-semibold text-black">Place of Supply:</span><span>{invoice.placeOfSupply || "—"}</span>
                </div>
              </div>
            </div>

            <div className="grid border-b border-slate-300 md:grid-cols-2">
              <div className="border-b border-slate-300 md:border-b-0 md:border-r">
                <div className={secHeader}>Ship From:</div>
                <div className="p-3 whitespace-pre-line text-[12px] leading-5 text-black">{invoice.shipToAddress || "—"}</div>
              </div>
              <div>
                <div className={secHeader}>Transportation Details:</div>
                <div className="p-3 text-[12px] leading-5 text-black">
                  <div>Transport Name: {invoice.transportName || "—"}</div>
                  <div>Vehicle Number: {invoice.vehicleNumber || "—"}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border-b border-slate-300">
              <table className="w-full table-fixed border-collapse text-[11px]">
                {showDiscount ? (
                  <colgroup>
                    <col className="w-[3%]" /><col className="w-[18%]" /><col className="w-[8%]" />
                    <col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[8%]" />
                    <col className="w-[8%]" /><col className="w-[9%]" /><col className="w-[9%]" />
                    <col className="w-[9%]" /><col className="w-[10%]" />
                  </colgroup>
                ) : (
                  <colgroup>
                    <col className="w-[3%]" /><col className="w-[20%]" /><col className="w-[8%]" />
                    <col className="w-[6%]" /><col className="w-[6%]" /><col className="w-[9%]" />
                    <col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[10%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                )}
                <thead>
                  <tr className="bg-[#bec9d9] text-black">
                    <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">#</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Item name</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">HSN/SAC</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Qty</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Unit</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Price/unit</th>
                    {showDiscount && <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Discount</th>}
                    <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable Amt</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">GST</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Final Rate</th>
                    <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item, i) => (
                    <tr key={item.id || i} className="odd:bg-white even:bg-slate-50/50">
                      <td className="border border-slate-300 px-1.5 py-1.5 align-top">{i + 1}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 align-top break-words whitespace-normal">{item.description || "—"}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.hsn || "—"}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{item.qty}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.unit || "—"}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{fmt(item.rate)}</td>
                      {showDiscount && <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{metricCell(item.discountAmount, item.discountPercent)}</td>}
                      <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{fmt(item.taxableAmount)}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{metricCell(item.gstAmount, item.taxPercent)}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{fmt(item.finalRatePerUnit)}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top font-semibold text-black">{fmt(item.rowAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-semibold text-black text-[11px]">
                    <td className="border border-slate-300 px-1.5 py-1.5" colSpan={3}>Total</td>
                    <td className="border border-slate-300 px-1.5 py-1.5 text-right">{rows.reduce((s, r) => s + r.qty, 0)}</td>
                    <td className="border border-slate-300 px-1.5 py-1.5" />
                    <td className="border border-slate-300 px-1.5 py-1.5" />
                    {showDiscount && <td className="border border-slate-300 px-1.5 py-1.5 text-right">{fmt(totals.discountTotal)}</td>}
                    <td className="border border-slate-300 px-1.5 py-1.5 text-right">{fmt(totals.taxableBeforeExtra)}</td>
                    <td className="border border-slate-300 px-1.5 py-1.5 text-right">{fmt(totals.taxBeforeExtra)}</td>
                    <td className="border border-slate-300 px-1.5 py-1.5" />
                    <td className="border border-slate-300 px-1.5 py-1.5 text-right">{fmt(totals.taxableBeforeExtra + totals.taxBeforeExtra)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid border-b border-slate-300 md:grid-cols-[1fr_280px]">
              <div className="border-b border-slate-300 md:border-b-0 md:border-r">
                <div className={secHeader}>Tax Summary:</div>
                <div className="p-3">
                  <div className="mb-2 print:hidden">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-black">Tax Option</span>
                    <select
                      value={taxType}
                      onChange={(event) => handleTaxChange(event.target.value as TaxType)}
                      disabled={!isInteractive}
                      className="w-48 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-black disabled:opacity-60"
                    >
                      <option value="cgst-sgst">CGST + SGST</option>
                      <option value="igst">IGST</option>
                      <option value="none">No Tax</option>
                    </select>
                  </div>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-black">
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
                        <td className="border border-slate-300 px-2 py-1 font-semibold text-black">{fmt(totals.taxable)}</td>
                        {taxType === "cgst-sgst" ? (
                          <>
                            <td className="border border-slate-300 px-2 py-1 text-right">{totals.cgstRate.toFixed(2)}%</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totals.cgst)}</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{totals.sgstRate.toFixed(2)}%</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totals.sgst)}</td>
                          </>
                        ) : taxType === "igst" ? (
                          <>
                            <td className="border border-slate-300 px-2 py-1 text-right">{totals.igstRate.toFixed(2)}%</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totals.igst)}</td>
                          </>
                        ) : null}
                        <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totals.tax)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2.5 text-[11px] text-black">
                    <span className="font-semibold text-black">Amount in Words: </span>
                    {numberToIndianWords(totals.grandTotal)}
                  </div>
                </div>
              </div>
              <div className="p-3 text-[12px] text-black">
                {totals.discountTotal > 0 && (
                  <div className="mt-0.5 flex justify-between gap-2">
                    <span>Item-wise Discount</span>
                    <span className="shrink-0 text-right">: {fmt(totals.discountTotal)}</span>
                  </div>
                )}
                {totals.extraDiscount > 0 && (
                  <div className="mt-0.5 flex justify-between gap-2 text-amber-700">
                    <span>Discount on Taxable Amt</span>
                    <span className="shrink-0 text-right">: {fmt(totals.extraDiscount)}</span>
                  </div>
                )}
                <div className="mt-0.5 flex justify-between gap-2">
                  <span>Taxable Amount</span>
                  <span className="shrink-0 text-right">: {fmt(totals.extraDiscount > 0 ? totals.taxable : totals.taxableBeforeExtra)}</span>
                </div>
                <div className="mt-0.5 flex justify-between gap-2">
                  <span>Tax</span>
                  <span className="shrink-0 text-right">: {fmt(totals.tax)}</span>
                </div>
                {Math.abs(totals.roundOff) > 0 && (
                  <div className="mt-0.5 flex justify-between gap-2">
                    <span>Round Off</span>
                    <span className="shrink-0 text-right">: {fmt(totals.roundOff)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between gap-2 border-t border-slate-300 pt-2 text-[14px] font-bold text-black">
                  <span>Grand Total</span>
                  <span className="shrink-0 text-right">: {fmt(totals.grandTotal)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-2">
                  <span>Payment Mode</span>
                  <span className="shrink-0 text-right">: {invoice.paymentMode || "—"}</span>
                </div>
                <div className="mt-0.5 flex justify-between gap-2 font-semibold text-black">
                  <span>Balance</span>
                  <span className="shrink-0 text-right">: {fmt(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="grid border-b border-slate-300 md:grid-cols-[7fr_3fr]">
              {(hasNotes || hasTerms) && (
                <div className="border-b border-slate-300 md:border-b-0 md:border-r">
                  {hasNotes && (
                    <>
                      <div className={secHeader}>Notes</div>
                      <div className="whitespace-pre-line px-4 py-2.5 text-[12px] leading-5 text-black">{invoice.notes}</div>
                    </>
                  )}
                 
                </div>
              )}

              <div className="flex flex-col">
                <div className={`${secHeader} text-right`}>For Radiatech Electra:</div>
                <div className="flex flex-1 flex-col items-end justify-end p-3">
                  <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-black">
                    {invoice.signatureImage ? (
                      <img src={invoice.signatureImage} alt="Signature" className="h-full w-full object-contain" />
                    ) : "Signature"}
                  </div>
                  <div className="mt-1 text-center text-[11px] font-semibold text-black">
                    {invoice.authorizedSignature || "Authorized Signatory"}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
