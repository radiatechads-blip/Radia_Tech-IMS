// "use client";

// import type { InvoiceSummary } from "@/lib/invoiceRoute";
// import { getBillTypeLabel } from "@/lib/invoiceRoute";
// import Image from "next/image";
// import { useMemo, useState } from "react";

// type TaxType = "cgst-sgst" | "igst" | "none";

// const ONES = [
//   "",
//   "One",
//   "Two",
//   "Three",
//   "Four",
//   "Five",
//   "Six",
//   "Seven",
//   "Eight",
//   "Nine",
//   "Ten",
//   "Eleven",
//   "Twelve",
//   "Thirteen",
//   "Fourteen",
//   "Fifteen",
//   "Sixteen",
//   "Seventeen",
//   "Eighteen",
//   "Nineteen",
// ];
// const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

// function twoDigits(n: number): string {
//   if (n < 20) return ONES[n];
//   return `${TENS[Math.floor(n / 10)]}${ONES[n % 10] ? ` ${ONES[n % 10]}` : ""}`;
// }

// function threeDigits(n: number): string {
//   const parts: string[] = [];
//   const hundreds = Math.floor(n / 100);
//   const rest = n % 100;
//   if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
//   if (rest > 0) parts.push(twoDigits(rest));
//   return parts.join(" ");
// }

// function numberToIndianWords(value: number): string {
//   const rounded = Math.round(value);
//   if (rounded === 0) return "Zero";

//   const negative = rounded < 0;
//   let n = Math.abs(rounded);

//   const crore = Math.floor(n / 10000000);
//   n %= 10000000;
//   const lakh = Math.floor(n / 100000);
//   n %= 100000;
//   const thousand = Math.floor(n / 1000);
//   n %= 1000;
//   const rest = n;

//   const parts: string[] = [];
//   if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
//   if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
//   if (thousand > 0) parts.push(`${threeDigits(thousand)} Thousand`);
//   if (rest > 0) parts.push(threeDigits(rest));

//   return `${negative ? "Minus " : ""}${parts.join(" ")} Only`;
// }

// const formatCurrency = (value?: number) =>
//   `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// const formatDate = (value?: string | null) => {
//   if (!value) return "—";
//   const date = new Date(value);
//   return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
// };

// interface InvoicePreviewProps {
//   invoice: InvoiceSummary;
//   taxType?: TaxType;
//   onTaxTypeChange?: (type: TaxType) => void;
// }

// export default function InvoicePreview({
//   invoice,
//   taxType: taxTypeProp,
//   onTaxTypeChange,
// }: InvoicePreviewProps) {
//   const isInteractive = onTaxTypeChange !== undefined;
//   const [internalTaxType, setInternalTaxType] = useState<TaxType>(
//     (invoice.taxType as TaxType) || "cgst-sgst",
//   );
//   const taxType = taxTypeProp ?? internalTaxType;

//   const items = useMemo(() => invoice.items || [], [invoice.items]);
//   const roundOff = Number(invoice.roundOff ?? 0);
//   const shouldShowDiscountColumn = items.some(
//     (item) => Number(item.discountPercent || 0) > 0,
//   );

//   const rows = useMemo(
//     () =>
//       items.map((item) => {
//         const rate = Number(item.rate || 0);
//         const qty = Number(item.qty || 0);
//         const discountPercent = Number(item.discountPercent || 0);
//         const taxPercent = Number(item.taxPercent || 0);

//         const taxablePerUnit = rate * (1 - discountPercent / 100);
//         const taxableAmount = qty * taxablePerUnit;
//         const discountAmount = qty * rate * (discountPercent / 100);
//         const gstAmount = taxableAmount * (taxPercent / 100);
//         const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (taxPercent / 100);
//         const rowAmount = taxableAmount + gstAmount;

//         return {
//           ...item,
//           taxablePerUnit,
//           taxableAmount,
//           discountAmount,
//           gstAmount,
//           finalRatePerUnit,
//           rowAmount,
//           rate,
//           qty,
//           discountPercent,
//           taxPercent,
//         };
//       }),
//     [items],
//   );

//   const totals = useMemo(() => {
//     const discountTotal = rows.reduce((sum, r) => sum + r.discountAmount, 0);
//     const taxableBeforeExtraDiscount = rows.reduce((sum, r) => sum + r.taxableAmount, 0);
//     const taxBeforeExtraDiscount = rows.reduce((sum, r) => sum + r.gstAmount, 0);

//     const extraDiscountAmount = Number(invoice.extraDiscountAmount || 0);
//     const taxable =
//       extraDiscountAmount > 0
//         ? Math.max(0, taxableBeforeExtraDiscount - extraDiscountAmount)
//         : taxableBeforeExtraDiscount;
//     const tax =
//       extraDiscountAmount > 0
//         ? rows.reduce((sum, r) => {
//             const ratio =
//               taxableBeforeExtraDiscount > 0 ? r.taxableAmount / taxableBeforeExtraDiscount : 0;
//             return sum + r.gstAmount * ratio;
//           }, 0)
//         : taxBeforeExtraDiscount;

//     const grandTotalBeforeRoundOff = taxable + tax;
//     const grandTotal = grandTotalBeforeRoundOff + roundOff;

//     const cgstRate =
//       taxType === "cgst-sgst"
//         ? rows.length > 0
//           ? Number(rows[0].taxPercent || 0) / 2
//           : 0
//         : 0;
//     const sgstRate = cgstRate;
//     const igstRate =
//       taxType === "igst"
//         ? rows.length > 0
//           ? Number(rows[0].taxPercent || 0)
//           : 0
//         : 0;

//     const cgst = tax / 2;
//     const sgst = tax / 2;
//     const igst = tax;

//     return {
//       discountTotal,
//       taxableBeforeExtraDiscount,
//       taxBeforeExtraDiscount,
//       extraDiscountAmount,
//       taxable,
//       tax,
//       roundOff,
//       grandTotalBeforeRoundOff,
//       grandTotal,
//       cgstRate,
//       sgstRate,
//       igstRate,
//       cgst,
//       sgst,
//       igst,
//     };
//   }, [rows, taxType, invoice.extraDiscountAmount, roundOff]);

//   const handleTaxTypeChange = (value: TaxType) => {
//     if (onTaxTypeChange) {
//       onTaxTypeChange(value);
//     } else {
//       setInternalTaxType(value);
//     }
//   };

//   const renderCompactMetricCell = (amount: number, rate: number) => {
//     if (rate <= 0) return <span className="text-black">—</span>;
//     return (
//       <span>
//         {formatCurrency(amount)}
//         <span className="ml-1 text-[10px] text-black">({rate.toFixed(2)}%)</span>
//       </span>
//     );
//   };

//   const docLabel = getBillTypeLabel(invoice);
//   const signatureImageSrc = invoice.signatureImage?.trim() ? invoice.signatureImage : "/STAMP.jpeg";
//   const hasNotes = !!invoice.notes?.trim();
//   const hasTerms = !!invoice.terms?.trim();
//   const hasNotesOrTerms = hasNotes || hasTerms;
//   const sectionLabel = "mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black";

//   return (
//     <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0">
//       <div className="mx-auto w-full max-w-225 overflow-hidden border border-slate-300 bg-white text-black print:max-w-none print:w-[210mm] print:min-h-[297mm] print:rounded-none print:border-0 print:shadow-none print:bg-white">
//         <div className="flex items-center justify-between border-b border-slate-300 px-4 py-2 text-black">
//           <div className="text-[13px] font-semibold uppercase tracking-normal">Proforma Invoice</div>
//           <div className="text-[11px] uppercase tracking-normal"></div>
//         </div>

//         <div className="flex items-start justify-between gap-3 border-b border-slate-300 px-4 py-3">
//           <div className="flex items-start gap-3">
//             <Image src="/favicon.png" alt="Logo" width={64} height={64} className="h-14 w-14 object-contain" unoptimized />
//             <div>
//               <h3 className="text-[18px] font-bold tracking-wide text-black">RADIATECH ELECTRA</h3>
//               <p className="mt-0.5 text-[12px] leading-snug text-black">
//                 Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
//               </p>
//             </div>
//           </div>
//           <div className="shrink-0 text-right text-[11px] leading-5 text-black">
//             <div>Phone: +91 81788 50959</div>
//             <div>Email: sales@radiatech.in</div>
//             <div>GSTIN: 09DDZPK0004H1ZF</div>
//             <div>State: 09-Uttar Pradesh</div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2 print:grid-cols-2">
//           <div className="border-b border-slate-300 p-3 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
//             <div className={sectionLabel}>Proforma To</div>
//             <div className="space-y-0.5 text-[12px] leading-5 text-black">
//               <div className="font-semibold">{invoice.partyName || "—"}</div>
//               {invoice.contactPerson ? <div> {invoice.contactPerson}</div> : null}
//               <div>{invoice.address || "—"}</div>
//               <div>{[invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(", ") || "—"}</div>
//               <div>Contact No: {invoice.phone || "—"}</div>
//               <div>Email: {invoice.email || "—"}</div>
//               <div>GSTIN: {invoice.gstin || "—"}</div>
//             </div>
//           </div>

//           <div className="p-3">
//             <div className={sectionLabel}>Proforma Details</div>
//             <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[12px] text-black">
//               <span className="font-semibold">Proforma No:</span>
//               <span>{invoice.invoiceNumber || "—"}</span>
//               <span className="font-semibold">Date:</span>
//               <span>{formatDate(String(invoice.invoiceDate || invoice.createdAt))}</span>
//               <span className="font-semibold">Valid Till:</span>
//               <span>{formatDate(String(invoice.dueDate || ""))}</span>
//               <span className="font-semibold">PO Date:</span>
//               <span>{formatDate(String(invoice.poDate || ""))}</span>
//               <span className="font-semibold">PO No:</span>
//               <span>{invoice.poNo || "—"}</span>
//               <span className="font-semibold">Place of Supply:</span>
//               <span>{invoice.placeOfSupply || "—"}</span>
//               {invoice.transportName ? (
//                 <>
//                   <span className="font-semibold">Transport:</span>
//                   <span>{invoice.transportName}</span>
//                 </>
//               ) : null}
//               {invoice.vehicleNumber ? (
//                 <>
//                   <span className="font-semibold">Vehicle No:</span>
//                   <span>{invoice.vehicleNumber}</span>
//                 </>
//               ) : null}
//               {invoice.ewayBillNo ? (
//                 <>
//                   <span className="font-semibold">E-way Bill No:</span>
//                   <span>{invoice.ewayBillNo}</span>
//                 </>
//               ) : null}
//             </div>
//           </div>
//         </div>

//         <div className="overflow-x-auto border-b border-slate-300">
//           <table className="w-full border-collapse text-[11px]">
//             <colgroup>
//               <col className="w-[3%]" />
//               <col className="w-[22%]" />
//               <col className="w-[8%]" />
//               <col className="w-[6%]" />
//               <col className="w-[5%]" />
//               <col className="w-[8%]" />
//               {shouldShowDiscountColumn ? <col className="w-[8%]" /> : null}
//               <col className="w-[8%]" />
//               <col className="w-[9%]" />
//               <col className="w-[8%]" />
//               <col className="w-[8%]" />
//               <col className="w-[10%]" />
//             </colgroup>
//             <thead>
//               <tr className="bg-white text-black">
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">#</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">Item name</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">HSN/SAC</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Qty</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">Unit</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Price/unit</th>
//                 {shouldShowDiscountColumn ? (
//                   <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Discount</th>
//                 ) : null}
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Taxable/unit</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Taxable amt</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">GST</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Final rate</th>
//                 <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((item, index) => (
//                 <tr key={item.id || index} className="text-black">
//                   <td className="border border-slate-300 px-1.5 py-1.5 align-top">{index + 1}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.description || "—"}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.hsn || "—"}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{item.qty}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.unit || "—"}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.rate)}</td>
//                   {shouldShowDiscountColumn ? (
//                     <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">
//                       {renderCompactMetricCell(item.discountAmount, item.discountPercent)}
//                     </td>
//                   ) : null}
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxablePerUnit)}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxableAmount)}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{renderCompactMetricCell(item.gstAmount, item.taxPercent)}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.finalRatePerUnit)}</td>
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top font-semibold">{formatCurrency(item.rowAmount)}</td>
//                 </tr>
//               ))}
//             </tbody>
//             <tfoot>
//               <tr className="bg-white text-black">
//                 <td className="border border-slate-300 px-1.5 py-1.5" colSpan={3}>Total</td>
//                 <td className="border border-slate-300 px-1.5 py-1.5 text-right">{rows.reduce((sum, item) => sum + item.qty, 0)}</td>
//                 <td className="border border-slate-300 px-1.5 py-1.5" />
//                 <td className="border border-slate-300 px-1.5 py-1.5" />
//                 {shouldShowDiscountColumn ? (
//                   <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.discountTotal)}</td>
//                 ) : null}
//                 <td className="border border-slate-300 px-1.5 py-1.5" />
//                 <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
//                 <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
//                 <td className="border border-slate-300 px-1.5 py-1.5" />
//                 <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}</td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>

//         <div className="grid grid-cols-1 border-b border-slate-300 md:grid-cols-[1.1fr_0.9fr] print:grid-cols-2">
//           <div className="border-b border-slate-300 p-3 md:border-b-0 md:border-r print:border-b-0 print:border-r">
//             <div className={sectionLabel}>Tax Summary</div>
//             <div className="mt-0.5">
//               <div className="mb-1.5">
//                 <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-black">Tax Option</span>
//                 <select
//                   value={taxType}
//                   onChange={(event) => handleTaxTypeChange(event.target.value as TaxType)}
//                   disabled={!isInteractive}
//                   className="mt-1 w-40 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-black disabled:opacity-60"
//                 >
//                   <option value="cgst-sgst">CGST + SGST</option>
//                   <option value="igst">IGST</option>
//                   <option value="none">No Tax</option>
//                 </select>
//               </div>
//               <table className="w-full border-collapse text-[11px] text-black">
//                 <thead>
//                   <tr>
//                     <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Taxable</th>
//                     {taxType === "cgst-sgst" ? (
//                       <>
//                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST</th>
//                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST</th>
//                       </>
//                     ) : taxType === "igst" ? (
//                       <>
//                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST</th>
//                       </>
//                     ) : null}
//                     <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Total Tax</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td className="border border-slate-300 px-2 py-1 font-semibold">{formatCurrency(totals.taxable)}</td>
//                     {taxType === "cgst-sgst" ? (
//                       <>
//                         <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
//                         <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
//                       </>
//                     ) : taxType === "igst" ? (
//                       <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
//                     ) : null}
//                     <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
//                   </tr>
//                 </tbody>
//               </table>
//               <div className="mt-1 text-[11px] text-black">
//                 <span className="font-semibold">Amount in Words:</span> {numberToIndianWords(totals.grandTotal)}
//               </div>
//             </div>
//           </div>

//           <div className="p-3 text-[12px] text-black">
//             {totals.discountTotal > 0 ? (
//               <div className="flex justify-between gap-2 py-0.5">
//                 <span>Item-wise Discount</span>
//                 <span>{formatCurrency(totals.discountTotal)}</span>
//               </div>
//             ) : null}
//             {totals.extraDiscountAmount > 0 ? (
//               <div className="flex justify-between gap-2 py-0.5 text-black">
//                 <span>Discount on Taxable Amount</span>
//                 <span>{formatCurrency(totals.extraDiscountAmount)}</span>
//               </div>
//             ) : null}
//             <div className="flex justify-between gap-2 py-0.5">
//               <span>Taxable Amount</span>
//               <span>{formatCurrency(totals.extraDiscountAmount > 0 ? totals.taxable : totals.taxableBeforeExtraDiscount)}</span>
//             </div>
//             <div className="flex justify-between gap-2 py-0.5">
//               <span>Tax</span>
//               <span>{formatCurrency(totals.tax)}</span>
//             </div>
//             {Math.abs(totals.roundOff) > 0 ? (
//               <div className="flex justify-between gap-2 py-0.5">
//                 <span>Round Off</span>
//                 <span>{formatCurrency(totals.roundOff)}</span>
//               </div>
//             ) : null}
//             <div className="mt-2 flex justify-between gap-2 border-t border-slate-300 pt-2 text-[13px] font-semibold">
//               <span>Grand Total</span>
//               <span>{formatCurrency(totals.grandTotal)}</span>
//             </div>
//             <div className="mt-2 flex justify-between gap-2 py-0.5">
//               <span>Payment Mode</span>
//               <span>{invoice.paymentMode || "—"}</span>
//             </div>
//             <div className="mt-0.5 flex justify-between gap-2 font-semibold">
//               <span>Balance</span>
//               <span>{formatCurrency(totals.grandTotal)}</span>
//             </div>
//           </div>
//         </div>

//         {hasNotesOrTerms ? (
//           <div className="border-b border-slate-300 p-3 text-[12px] leading-5 text-black">
//             {hasNotes ? (
//               <div className="mb-2">
//                 <div className={sectionLabel}>Notes</div>
//                 <div className="mt-1 whitespace-pre-line">{invoice.notes}</div>
//               </div>
//             ) : null}
//             {hasTerms ? (
//               <div>
//                 <div className={sectionLabel}>Terms &amp; Conditions</div>
//                 <div className="mt-1 whitespace-pre-line">{invoice.terms}</div>
//               </div>
//             ) : null}
//           </div>
//         ) : null}

//         <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2 print:grid-cols-2">
//           <div className="border-b border-slate-300 p-3 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
//             <div className={sectionLabel}>Bank Details</div>
//             <div className="mt-1 whitespace-pre-line text-[12px] leading-5 text-black">{invoice.bankDetails || "—"}</div>
//           </div>
//           <div className="p-3">
//             <div className={sectionLabel}>For Radiatech Electra</div>
//             <div className="mt-1 flex flex-col items-start">
//               <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded border border-slate-300 bg-slate-50 text-[11px] text-black">
//                 {invoice.signatureImage ? (
//                   <Image src={signatureImageSrc} alt="Signature" width={128} height={64} className="h-full w-full object-contain" unoptimized />
//                 ) : (
//                   "Signature"
//                 )}
//               </div>
//               <div className="mt-1 text-[11px] font-semibold text-black">{invoice.authorizedSignature || "Authorized Signatory"}</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }



"use client";

import type { InvoiceSummary } from "@/lib/invoiceRoute";
import { getBillTypeLabel } from "@/lib/invoiceRoute";
import Image from "next/image";
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
  if (thousand > 0) parts.push(`${threeDigits(thousand)} Thousand`);
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="relative -mx-3 -mt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#294c76] bg-[#e7eef9] border-b border-slate-300">
      {title}
    </div>
  );
}

interface InvoicePreviewProps {
  invoice: InvoiceSummary;
  taxType?: TaxType;
  onTaxTypeChange?: (type: TaxType) => void;
}

export default function InvoicePreview({
  invoice,
  taxType: taxTypeProp,
  onTaxTypeChange,
}: InvoicePreviewProps) {
  const isInteractive = onTaxTypeChange !== undefined;
  const [internalTaxType, setInternalTaxType] = useState<TaxType>(
    (invoice.taxType as TaxType) || "cgst-sgst",
  );
  const taxType = taxTypeProp ?? internalTaxType;

  const items = useMemo(() => invoice.items || [], [invoice.items]);
  const hasRoundOff = invoice.roundOff !== undefined && invoice.roundOff !== null && invoice.roundOff !== "";
  const roundOff = Number.isFinite(Number(invoice.roundOff)) ? Number(invoice.roundOff) : 0;
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
    const discountTotal = rows.reduce((sum, r) => sum + r.discountAmount, 0);
    const taxableBeforeExtraDiscount = rows.reduce((sum, r) => sum + r.taxableAmount, 0);
    const taxBeforeExtraDiscount = rows.reduce((sum, r) => sum + r.gstAmount, 0);

    const extraDiscountAmount = Number(invoice.extraDiscountAmount || 0);
    const taxable =
      extraDiscountAmount > 0
        ? Math.max(0, taxableBeforeExtraDiscount - extraDiscountAmount)
        : taxableBeforeExtraDiscount;
    const tax =
      extraDiscountAmount > 0
        ? rows.reduce((sum, r) => {
            const ratio =
              taxableBeforeExtraDiscount > 0 ? r.taxableAmount / taxableBeforeExtraDiscount : 0;
            return sum + r.gstAmount * ratio;
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

  const renderCompactMetricCell = (amount: number, rate: number) => {
    if (rate <= 0) return <span className="text-black">—</span>;
    return (
      <span className="flex flex-col items-end leading-none">
        <span>{formatCurrency(amount)}</span>
        <span className="text-[9px] text-slate-500">({rate.toFixed(1)}%)</span>
      </span>
    );
  };

  const docLabel = getBillTypeLabel(invoice);
  const signatureImageSrc = invoice.signatureImage?.trim() ? invoice.signatureImage : "/STAMP.jpeg";
  const hasNotes = !!invoice.notes?.trim();
  const hasTerms = !!invoice.terms?.trim();
  const hasNotesOrTerms = hasNotes || hasTerms;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0">
      <div className="mx-auto w-full max-w-225 overflow-hidden border border-slate-300 bg-white text-black print:max-w-none print:w-[210mm] print:min-h-[297mm] print:rounded-none print:border-0 print:shadow-none print:bg-white">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-300 bg-slate-100 px-4 py-2 text-black">
          <div className="text-[13px] font-bold uppercase tracking-wide text-slate-800">
            {docLabel || "Proforma Invoice"}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Original Copy
          </div>
        </div>

        {/* Company Info */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-300 px-4 py-3">
          <div className="flex items-start gap-3">
            <Image src="/favicon.png" alt="Logo" width={64} height={64} className="h-14 w-14 object-contain" unoptimized />
            <div>
              <h3 className="text-[18px] font-bold tracking-wide text-black">RADIATECH ELECTRA</h3>
              <p className="mt-0.5 text-[12px] leading-snug text-slate-600">
                Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right text-[11px] leading-5 text-slate-700">
            <div><span className="font-medium text-slate-900">Phone:</span> +91 81788 50959</div>
            <div><span className="font-medium text-slate-900">Email:</span> sales@radiatech.in</div>
            <div><span className="font-medium text-slate-900">GSTIN:</span> 09DDZPK0004H1ZF</div>
            <div><span className="font-medium text-slate-900">State:</span> 09-Uttar Pradesh</div>
          </div>
        </div>

        {/* Proforma To & Details */}
        <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2 print:grid-cols-2">
          <div className="border-b border-slate-300 pt-0 pb-3 px-3 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
            <SectionHeader title="Proforma To" />
            <div className="space-y-0.5 text-[12px] leading-5 text-slate-800">
              <div className="font-bold text-black">{invoice.partyName || "—"}</div>
              {invoice.contactPerson ? <div>{invoice.contactPerson}</div> : null}
              <div>{invoice.address || "—"}</div>
              <div>{[invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(", ") || "—"}</div>
              <div>Contact No: {invoice.phone || "—"}</div>
              <div>Email: {invoice.email || "—"}</div>
              <div>GSTIN: {invoice.gstin || "—"}</div>
            </div>
          </div>

          <div className="pt-0 pb-3 px-3">
            <SectionHeader title="Proforma Details" />
            <div className="grid grid-cols-[auto_1fr] gap-x-0 gap-y-1 text-[12px] text-slate-800">
              <span className="font-semibold text-slate-900">Proforma No:</span>
              <span>{invoice.invoiceNumber || "—"}</span>
              <span className="font-semibold text-slate-900">Date:</span>
              <span>{formatDate(String(invoice.invoiceDate || invoice.createdAt))}</span>
              <span className="font-semibold text-slate-900">Valid Till:</span>
              <span>{formatDate(String(invoice.dueDate || ""))}</span>
              <span className="font-semibold text-slate-900">PO Date:</span>
              <span>{formatDate(String(invoice.poDate || ""))}</span>
              <span className="font-semibold text-slate-900">PO No:</span>
              <span>{invoice.poNo || "—"}</span>
              <span className="font-semibold text-slate-900">Place of Supply:</span>
              <span>{invoice.placeOfSupply || "—"}</span>
              {invoice.transportName && (
                <>
                  <span className="font-semibold text-slate-900">Transport:</span>
                  <span>{invoice.transportName}</span>
                </>
              )}
              {invoice.vehicleNumber && (
                <>
                  <span className="font-semibold text-slate-900">Vehicle No:</span>
                  <span>{invoice.vehicleNumber}</span>
                </>
              )}
              {invoice.ewayBillNo && (
                <>
                  <span className="font-semibold text-slate-900">E-way Bill No:</span>
                  <span>{invoice.ewayBillNo}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto border-b border-slate-300">
          <table className="w-full border-collapse text-[11px]">
            <colgroup>
              <col className="w-[3%]" />
              <col className="w-[22%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
              <col className="w-[5%]" />
              <col className="w-[8%]" />
              {shouldShowDiscountColumn ? <col className="w-[8%]" /> : null}
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">#</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">Item name</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">HSN/SAC</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Qty</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-left font-semibold">Unit</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Price/unit</th>
                {shouldShowDiscountColumn ? (
                  <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Discount</th>
                ) : null}
                <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Taxable/unit</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Taxable amt</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">GST</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Final rate</th>
                <th className="border border-slate-300 px-1.5 py-1.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.id || index} className="text-slate-800">
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{index + 1}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.description || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.hsn || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{item.qty}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.unit || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.rate)}</td>
                  {shouldShowDiscountColumn ? (
                    <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">
                      {renderCompactMetricCell(item.discountAmount, item.discountPercent)}
                    </td>
                  ) : null}
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxablePerUnit)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxableAmount)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{renderCompactMetricCell(item.gstAmount, item.taxPercent)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.finalRatePerUnit)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top font-semibold text-black">{formatCurrency(item.rowAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-black">
                <td className="border border-slate-300 px-1.5 py-1.5" colSpan={3}>Total</td>
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{rows.reduce((sum, item) => sum + item.qty, 0)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5" />
                {shouldShowDiscountColumn ? (
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.discountTotal)}</td>
                ) : null}
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tax Summary & Breakdown */}
        <div className="grid grid-cols-1 border-b border-slate-300 md:grid-cols-[1.1fr_0.9fr] print:grid-cols-2">
          <div className="border-b border-slate-300 pt-0 pb-3 px-3 md:border-b-0 md:border-r print:border-b-0 print:border-r">
            <SectionHeader title="Tax Summary" />
            <div className="mt-1">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-slate-500">Tax Option:</span>
                <select
                  value={taxType}
                  onChange={(event) => handleTaxTypeChange(event.target.value as TaxType)}
                  disabled={!isInteractive}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-800 disabled:opacity-60"
                >
                  <option value="cgst-sgst">CGST + SGST</option>
                  <option value="igst">IGST</option>
                  <option value="none">No Tax</option>
                </select>
              </div>
              <table className="w-full border-collapse text-[11px] text-slate-800">
                <thead>
                  <tr className="bg-slate-50">
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
                    <td className="border border-slate-300 px-2 py-1 font-semibold">{formatCurrency(totals.taxable)}</td>
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
                </tbody>
              </table>
              <div className="mt-2 text-[11px] text-slate-800">
                <span className="font-semibold text-slate-900">Amount in Words:</span> {numberToIndianWords(totals.grandTotal)}
              </div>
            </div>
          </div>

          <div className="pt-0 pb-3 px-3 text-[12px] text-slate-800">
            {totals.discountTotal > 0 ? (
              <div className="flex justify-between gap-2 py-0.5">
                <span>Item-wise Discount</span>
                <span>{formatCurrency(totals.discountTotal)}</span>
              </div>
            ) : null}
            {totals.extraDiscountAmount > 0 ? (
              <div className="flex justify-between gap-2 py-0.5 text-emerald-700">
                <span>Discount on Taxable Amount</span>
                <span>{formatCurrency(totals.extraDiscountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 py-0.5">
              <span>Taxable Amount</span>
              <span>{formatCurrency(totals.extraDiscountAmount > 0 ? totals.taxable : totals.taxableBeforeExtraDiscount)}</span>
            </div>
            <div className="flex justify-between gap-2 py-0.5">
              <span>Tax</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            {hasRoundOff ? (
              <div className="flex justify-between gap-2 py-0.5">
                <span>Round Off</span>
                <span>{formatCurrency(totals.roundOff)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between gap-2 border-t border-slate-300 pt-1.5 text-[13px] font-bold text-black">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
            <div className="mt-2 flex justify-between gap-2 py-0.5">
              <span>Payment Mode</span>
              <span>{invoice.paymentMode || "—"}</span>
            </div>
            <div className="mt-0.5 flex justify-between gap-2 font-semibold text-black">
              <span>Balance</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms Section */}
        {hasNotesOrTerms ? (
          <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2 print:grid-cols-2">
            <div className="border-b border-slate-300 pt-0 pb-3 px-3 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
              <SectionHeader title="Notes" />
              <div className="whitespace-pre-line text-[11px] leading-5 text-slate-700">
                {hasNotes ? invoice.notes : "—"}
              </div>
            </div>
            <div className="pt-0 pb-3 px-3">
              <SectionHeader title="Terms & Conditions" />
              <div className="whitespace-pre-line text-[11px] leading-5 text-slate-700">
                {hasTerms ? invoice.terms : "—"}
              </div>
            </div>
          </div>
        ) : null}

        {/* Bank Details & Authorized Signature */}
        <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2 print:grid-cols-2">
          <div className="border-b border-slate-300 pt-0 pb-3 px-3 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
            <SectionHeader title="Bank Details" />
            <div className="whitespace-pre-line text-[12px] leading-5 text-slate-800">{invoice.bankDetails || "—"}</div>
          </div>
          <div className="pt-0 pb-3 px-3">
            <SectionHeader title="For Radiatech Electra" />
            <div className="mt-2 flex flex-col items-start">
              <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded border border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                {invoice.signatureImage ? (
                  <Image src={signatureImageSrc} alt="Signature" width={128} height={64} className="h-full w-full object-contain" unoptimized />
                ) : (
                  "Signature"
                )}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-900">{invoice.authorizedSignature || "Authorized Signatory"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}