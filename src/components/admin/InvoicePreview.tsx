// // // "use client";

// // // import { getBillTypeLabel } from "@/lib/invoiceRoute";
// // // import type { InvoiceSummary } from "@/lib/invoiceRoute";
// // // import Image from "next/image";
// // // import { useMemo, useState } from "react";

// // // type TaxType = "cgst-sgst" | "igst" | "none";

// // // const ONES = [
// // //   "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
// // //   "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
// // //   "Sixteen", "Seventeen", "Eighteen", "Nineteen",
// // // ];
// // // const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

// // // function twoDigits(n: number): string {
// // //   if (n < 20) return ONES[n];
// // //   return `${TENS[Math.floor(n / 10)]}${ONES[n % 10] ? " " + ONES[n % 10] : ""}`;
// // // }

// // // function threeDigits(n: number): string {
// // //   const parts: string[] = [];
// // //   const hundreds = Math.floor(n / 100);
// // //   const rest = n % 100;
// // //   if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
// // //   if (rest > 0) parts.push(twoDigits(rest));
// // //   return parts.join(" ");
// // // }

// // // function numberToIndianWords(value: number): string {
// // //   const rounded = Math.round(value);
// // //   if (rounded === 0) return "Zero";

// // //   const negative = rounded < 0;
// // //   let n = Math.abs(rounded);

// // //   const crore = Math.floor(n / 10000000);
// // //   n %= 10000000;
// // //   const lakh = Math.floor(n / 100000);
// // //   n %= 100000;
// // //   const thousand = Math.floor(n / 1000);
// // //   n %= 1000;
// // //   const rest = n;

// // //   const parts: string[] = [];
// // //   if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
// // //   if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
// // //   if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
// // //   if (rest > 0) parts.push(threeDigits(rest));

// // //   return `${negative ? "Minus " : ""}${parts.join(" ")} Only`;
// // // }

// // // const formatCurrency = (value?: number) =>
// // //   `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// // // const formatDate = (value?: string) => {
// // //   if (!value) return "—";
// // //   const date = new Date(value);
// // //   return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
// // // };

// // // interface InvoicePreviewProps {
// // //   invoice: InvoiceSummary;
// // //   taxType?: TaxType;
// // //   onTaxTypeChange?: (type: TaxType) => void;
// // // }

// // // export default function InvoicePreview({
// // //   invoice,
// // //   taxType: taxTypeProp,
// // //   onTaxTypeChange,
// // // }: InvoicePreviewProps) {
// // //   const isInteractive = onTaxTypeChange !== undefined;
// // //   const [internalTaxType, setInternalTaxType] = useState<TaxType>(
// // //     (invoice.taxType as TaxType) || "cgst-sgst",
// // //   );
// // //   const taxType = taxTypeProp ?? internalTaxType;

// // //   const items = invoice.items || [];

// // //   const shouldShowDiscountColumn = items.some(
// // //     (item) => Number(item.discountPercent || 0) > 0,
// // //   );

// // //   const rows = useMemo(
// // //     () =>
// // //       items.map((item) => {
// // //         const rate = Number(item.rate || 0);
// // //         const qty = Number(item.qty || 0);
// // //         const discountPercent = Number(item.discountPercent || 0);
// // //         const taxPercent = Number(item.taxPercent || 0);

// // //         const taxablePerUnit = rate * (1 - discountPercent / 100);
// // //         const taxableAmount = qty * taxablePerUnit;
// // //         const discountAmount = qty * rate * (discountPercent / 100);
// // //         const gstAmount = taxableAmount * (taxPercent / 100);
// // //         const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (taxPercent / 100);
// // //         const rowAmount = taxableAmount + gstAmount;

// // //         return {
// // //           ...item,
// // //           taxablePerUnit,
// // //           taxableAmount,
// // //           discountAmount,
// // //           gstAmount,
// // //           finalRatePerUnit,
// // //           rowAmount,
// // //           rate,
// // //           qty,
// // //           discountPercent,
// // //           taxPercent,
// // //         };
// // //       }),
// // //     [items],
// // //   );

// // //   const totals = useMemo(() => {
// // //     const subtotal = rows.reduce((sum, r) => sum + r.qty * r.rate, 0);
// // //     const discountTotal = rows.reduce((sum, r) => sum + r.discountAmount, 0);
// // //     const taxableBeforeExtraDiscount = rows.reduce(
// // //       (sum, r) => sum + r.taxableAmount,
// // //       0,
// // //     );
// // //     const taxBeforeExtraDiscount = rows.reduce(
// // //       (sum, r) => sum + r.gstAmount,
// // //       0,
// // //     );

// // //     const extraDiscountAmount = Number(invoice.extraDiscountAmount || 0);
// // //     const taxable =
// // //       extraDiscountAmount > 0
// // //         ? Math.max(0, taxableBeforeExtraDiscount - extraDiscountAmount)
// // //         : taxableBeforeExtraDiscount;
// // //     const tax =
// // //       extraDiscountAmount > 0
// // //         ? rows.reduce((sum, r) => {
// // //             const ratio =
// // //               taxableBeforeExtraDiscount > 0
// // //                 ? r.taxableAmount / taxableBeforeExtraDiscount
// // //                 : 0;
// // //             return sum + r.gstAmount * ratio;
// // //           }, 0)
// // //         : taxBeforeExtraDiscount;

// // //     const grandTotal = taxable + tax;

// // //     const cgstRate =
// // //       taxType === "cgst-sgst"
// // //         ? rows.length > 0
// // //           ? Number(rows[0].taxPercent || 0) / 2
// // //           : 0
// // //         : 0;
// // //     const sgstRate = cgstRate;
// // //     const igstRate =
// // //       taxType === "igst"
// // //         ? rows.length > 0
// // //           ? Number(rows[0].taxPercent || 0)
// // //           : 0
// // //         : 0;

// // //     const cgst = tax / 2;
// // //     const sgst = tax / 2;
// // //     const igst = tax;

// // //     return {
// // //       subtotal,
// // //       discountTotal,
// // //       taxableBeforeExtraDiscount,
// // //       taxBeforeExtraDiscount,
// // //       extraDiscountAmount,
// // //       taxable,
// // //       tax,
// // //       grandTotal,
// // //       cgstRate,
// // //       sgstRate,
// // //       igstRate,
// // //       cgst,
// // //       sgst,
// // //       igst,
// // //     };
// // //   }, [rows, taxType, invoice.extraDiscountAmount]);

// // //   const handleTaxTypeChange = (value: TaxType) => {
// // //     if (onTaxTypeChange) {
// // //       onTaxTypeChange(value);
// // //     } else {
// // //       setInternalTaxType(value);
// // //     }
// // //   };

// // //   const renderCompactMetricCell = (amount: number, rate: number) => {
// // //     if (rate <= 0) return <span className="text-slate-400">—</span>;
// // //     return (
// // //       <span>
// // //         {formatCurrency(amount)}
// // //         <span className="ml-1 text-[10px] text-slate-400">
// // //           ({rate.toFixed(2)}%)
// // //         </span>
// // //       </span>
// // //     );
// // //   };

// // //   // Use getBillTypeLabel() instead of the raw invoice.billType field.
// // //   // The backend always stores billType as plain "Invoice" (not "Tax
// // //   // Invoice") for non-proforma/annexure records, so reading it directly
// // //   // showed the wrong heading here even when the list's badge (which
// // //   // does use getBillTypeLabel) correctly said "Tax Invoice". This also
// // //   // means a converted Proforma Invoice now correctly shows "Tax
// // //   // Invoice" as its heading in preview/print/PDF.
// // //   const docLabel = getBillTypeLabel(invoice);

// // //   return (
// // //     <section className="invoice-preview-shell rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0">
// // //       <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:min-h-[297mm] print:rounded-none print:border-0 print:shadow-none print:bg-white">
// // //         {/* Header bar */}
// // //         <div className="flex items-center justify-between border-b border-slate-300 bg-[#f7f9fc] px-6 py-3 print:px-5">
// // //           <h2 className="text-base font-semibold capitalize text-slate-900">
// // //             {docLabel}
// // //           </h2>
// // //           <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //             Original for Recipient
// // //           </span>
// // //         </div>

// // //         {/* Company row */}
// // //         <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 pb-4 pt-4 print:px-5">
// // //           <div className="flex items-start gap-3">
// // //             <div className="flex h-12 w-12 items-center justify-center rounded-md text-sm font-bold text-white">
// // //               <img src="/favicon.png" alt="Company Logo" />
// // //             </div>
// // //             <div>
// // //               <h3 className="text-xl font-bold tracking-wide text-slate-950">
// // //                 RADIATECH ELECTRA
// // //               </h3>
// // //               <p className="mt-1 text-[11px] text-slate-600">
// // //                 Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar
// // //                 Pradesh, 201301
// // //               </p>
// // //             </div>
// // //           </div>
// // //           <div className="text-right text-[11px] text-slate-600">
// // //             <div>Phone: +91 81788 50959</div>
// // //             <div>Email: sales@radiatech.in</div>
// // //             <div>GSTIN: 09DDZPK0004H1ZF</div>
// // //             <div>State: 09-Uttar Pradesh</div>
// // //           </div>
// // //         </div>

// // //         {/* Bill To + Invoice Details */}
// // //         <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
// // //           <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
// // //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// // //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //                 Bill To:
// // //               </p>
// // //               <div className="mt-1 text-[13px] leading-5 text-slate-800">
// // //                 <div className="font-semibold text-slate-900">
// // //                   {invoice.partyName || "—"}
// // //                 </div>
// // //                 {invoice.contactPerson ? (
// // //                   <div>Attn: {invoice.contactPerson}</div>
// // //                 ) : null}
// // //                 <div>{invoice.address || "—"}</div>
// // //                 <div>
// // //                   {[invoice.city, invoice.state, invoice.pincode]
// // //                     .filter(Boolean)
// // //                     .join(", ") || "—"}
// // //                 </div>
// // //                 <div>Contact No: {invoice.phone || "—"}</div>
// // //                 <div>Email: {invoice.email || "—"}</div>
// // //                 <div>GSTIN: {invoice.gstin || "—"}</div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //           <div className="bg-white p-4">
// // //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// // //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //                 Invoice Details:
// // //               </p>
// // //               <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[13px] text-slate-800">
// // //                 <span className="font-semibold text-slate-900">Invoice No:</span>
// // //                 <span>{invoice.invoiceNumber || "—"}</span>
// // //                 <span className="font-semibold text-slate-900">Date:</span>
// // //                 <span>
// // //                   {formatDate(invoice.invoiceDate || invoice.createdAt)}
// // //                 </span>
// // //                 <span className="font-semibold text-slate-900">PO Date:</span>
// // //                 <span>{formatDate(invoice.poDate || undefined)}</span>
// // //                 <span className="font-semibold text-slate-900">
// // //                   E-way Bill No:
// // //                 </span>
// // //                 <span>{invoice.ewayBillNo || "—"}</span>
// // //                 <span className="font-semibold text-slate-900">PO No:</span>
// // //                 <span>{invoice.poNo || "—"}</span>
// // //                 <span className="font-semibold text-slate-900">
// // //                   Reference No:
// // //                 </span>
// // //                 <span>{invoice.placeOfSupply || "—"}</span>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Ship To + Transportation Details */}
// // //         <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
// // //           <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
// // //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// // //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //                 Ship To:
// // //               </p>
// // //               <div className="mt-1 whitespace-pre-line text-[13px] text-slate-800">
// // //                 {invoice.shipToAddress || "—"}
// // //               </div>
// // //             </div>
// // //           </div>
// // //           <div className="bg-white p-4">
// // //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// // //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //                 Transportation Details:
// // //               </p>
// // //               <div className="mt-1 text-[13px] text-slate-800">
// // //                 <div>Transport Name: {invoice.transportName || "—"}</div>
// // //                 <div>Vehicle Number: {invoice.vehicleNumber || "—"}</div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Items table */}
// // //         <div className="invoice-table-wrap overflow-hidden border-b border-slate-300">
// // //           <table className="w-full border-collapse text-[12px]">
// // //             <thead>
// // //               <tr className="bg-[#bec9d9] text-left text-slate-700">
// // //                 <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
// // //                 <th className="border border-slate-300 px-2 py-2 font-semibold">
// // //                   Item name
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 font-semibold">
// // //                   HSN/SAC
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                   Quantity
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 font-semibold">
// // //                   Unit
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                   Price/unit (Rs)
// // //                 </th>
// // //                 {shouldShowDiscountColumn && (
// // //                   <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                     Discount
// // //                   </th>
// // //                 )}
// // //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                   Taxable Price/unit (Rs)
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                   Taxable amount (Rs)
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                   GST
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                   Final Rate (Rs)
// // //                 </th>
// // //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">
// // //                   Amount Total (Rs)
// // //                 </th>
// // //               </tr>
// // //             </thead>
// // //             <tbody>
// // //               {rows.map((item, index) => (
// // //                 <tr key={item.id || index}>
// // //                   <td className="border border-slate-300 px-2 py-2 align-top">
// // //                     {index + 1}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 align-top">
// // //                     {item.description || "Item description"}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 align-top">
// // //                     {item.hsn || "—"}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">
// // //                     {item.qty}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 align-top">
// // //                     {item.unit || "—"}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">
// // //                     {formatCurrency(item.rate)}
// // //                   </td>
// // //                   {shouldShowDiscountColumn && (
// // //                     <td className="border border-slate-300 px-2 py-2 text-right align-top">
// // //                       {renderCompactMetricCell(
// // //                         item.discountAmount,
// // //                         item.discountPercent,
// // //                       )}
// // //                     </td>
// // //                   )}
// // //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">
// // //                     {formatCurrency(item.taxablePerUnit)}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">
// // //                     {formatCurrency(item.taxableAmount)}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">
// // //                     {renderCompactMetricCell(item.gstAmount, item.taxPercent)}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">
// // //                     {formatCurrency(item.finalRatePerUnit)}
// // //                   </td>
// // //                   <td className="border border-slate-300 px-2 py-2 text-right align-top font-semibold text-slate-900">
// // //                     {formatCurrency(item.rowAmount)}
// // //                   </td>
// // //                 </tr>
// // //               ))}
// // //             </tbody>
// // //             <tfoot>
// // //               <tr className="bg-slate-50 font-semibold text-slate-900">
// // //                 <td
// // //                   className="border border-slate-300 px-2 py-2"
// // //                   colSpan={3}
// // //                 >
// // //                   Total
// // //                 </td>
// // //                 <td className="border border-slate-300 px-2 py-2 text-right">
// // //                   {rows.reduce((sum, item) => sum + item.qty, 0)}
// // //                 </td>
// // //                 <td className="border border-slate-300 px-2 py-2" />
// // //                 <td className="border border-slate-300 px-2 py-2" />
// // //                 {shouldShowDiscountColumn && (
// // //                   <td className="border border-slate-300 px-2 py-2 text-right">
// // //                     {formatCurrency(totals.discountTotal)}
// // //                   </td>
// // //                 )}
// // //                 <td className="border border-slate-300 px-2 py-2" />
// // //                 <td className="border border-slate-300 px-2 py-2 text-right">
// // //                   {formatCurrency(totals.taxableBeforeExtraDiscount)}
// // //                 </td>
// // //                 <td className="border border-slate-300 px-2 py-2 text-right">
// // //                   {formatCurrency(totals.taxBeforeExtraDiscount)}
// // //                 </td>
// // //                 <td className="border border-slate-300 px-2 py-2" />
// // //                 <td className="border border-slate-300 px-2 py-2 text-right">
// // //                   {formatCurrency(
// // //                     totals.taxableBeforeExtraDiscount +
// // //                       totals.taxBeforeExtraDiscount,
// // //                   )}
// // //                 </td>
// // //               </tr>
// // //             </tfoot>
// // //           </table>
// // //         </div>

// // //         {/* Tax Summary + Totals */}
// // //         <div className="grid grid-cols-1 border-b border-slate-300 bg-white md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
// // //           <div className="min-w-0 border-b border-slate-300 bg-slate-50 p-4 md:border-b-0 md:border-r">
// // //             <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
// // //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //                 Tax Summary:
// // //               </p>
// // //               <label className="mt-2 mb-2 block">
// // //                 <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //                   Tax Option
// // //                 </span>
// // //                 <select
// // //                   value={taxType}
// // //                   onChange={(event) =>
// // //                     handleTaxTypeChange(event.target.value as TaxType)
// // //                   }
// // //                   disabled={!isInteractive}
// // //                   className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[12px] text-slate-700 disabled:opacity-60"
// // //                 >
// // //                   <option value="cgst-sgst">CGST + SGST</option>
// // //                   <option value="igst">IGST</option>
// // //                   <option value="none">No Tax</option>
// // //                 </select>
// // //               </label>
// // //               <div className="mt-2 overflow-x-auto">
// // //                 <table className="min-w-[520px] w-full border-collapse text-[11px]">
// // //                   <thead>
// // //                     <tr className="bg-slate-100 text-left text-slate-600">
// // //                     <th className="border border-slate-300 px-2 py-1 font-semibold">
// // //                       Taxable
// // //                     </th>
// // //                     {taxType === "cgst-sgst" ? (
// // //                       <>
// // //                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">
// // //                           CGST (Rate)
// // //                         </th>
// // //                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">
// // //                           CGST (Amt)
// // //                         </th>
// // //                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">
// // //                           SGST (Rate)
// // //                         </th>
// // //                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">
// // //                           SGST (Amt)
// // //                         </th>
// // //                       </>
// // //                     ) : taxType === "igst" ? (
// // //                       <>
// // //                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">
// // //                           IGST (Rate)
// // //                         </th>
// // //                         <th className="border border-slate-300 px-2 py-1 text-right font-semibold">
// // //                           IGST (Amt)
// // //                         </th>
// // //                       </>
// // //                     ) : null}
// // //                     <th className="border border-slate-300 px-2 py-1 text-right font-semibold">
// // //                       Total Tax
// // //                     </th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   <tr className="bg-[#fbfcfe]">
// // //                     <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-900">
// // //                       {formatCurrency(totals.taxable)}
// // //                     </td>
// // //                     {taxType === "cgst-sgst" ? (
// // //                       <>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {totals.cgstRate.toFixed(2)}%
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {formatCurrency(totals.cgst)}
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {totals.sgstRate.toFixed(2)}%
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {formatCurrency(totals.sgst)}
// // //                         </td>
// // //                       </>
// // //                     ) : taxType === "igst" ? (
// // //                       <>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {totals.igstRate.toFixed(2)}%
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {formatCurrency(totals.igst)}
// // //                         </td>
// // //                       </>
// // //                     ) : null}
// // //                     <td className="border border-slate-300 px-2 py-1 text-right">
// // //                       {formatCurrency(totals.tax)}
// // //                     </td>
// // //                   </tr>
// // //                   <tr className="bg-[#ce9b24] font-semibold text-slate-900">
// // //                     <td className="border border-slate-300 px-2 py-1">TOTAL</td>
// // //                     {taxType === "cgst-sgst" ? (
// // //                       <>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           —
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {formatCurrency(totals.cgst)}
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           —
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {formatCurrency(totals.sgst)}
// // //                         </td>
// // //                       </>
// // //                     ) : taxType === "igst" ? (
// // //                       <>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           —
// // //                         </td>
// // //                         <td className="border border-slate-300 px-2 py-1 text-right">
// // //                           {formatCurrency(totals.igst)}
// // //                         </td>
// // //                       </>
// // //                     ) : null}
// // //                     <td className="border border-slate-300 px-2 py-1 text-right">
// // //                       {formatCurrency(totals.tax)}
// // //                     </td>
// // //                   </tr>
// // //                   </tbody>
// // //                 </table>
// // //               </div>

// // //               <div className="mt-3 text-[12px] text-slate-700">
// // //                 <span className="font-semibold text-slate-900">
// // //                   Invoice Amount in Words:{" "}
// // //                 </span>
// // //                 {numberToIndianWords(totals.grandTotal)}
// // //               </div>
// // //             </div>
// // //           </div>

// // //           <div className="min-w-0 bg-white p-4 text-[13px] text-slate-800">
// // //             {totals.discountTotal > 0 && (
// // //               <div className="mt-1 flex items-start justify-between gap-3">
// // //                 <span className="min-w-0 pr-2">Discount</span>
// // //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.discountTotal)}</span>
// // //               </div>
// // //             )}
// // //             {totals.extraDiscountAmount > 0 && (
// // //               <div className="mt-1 flex items-start justify-between gap-3 text-amber-700">
// // //                 <span className="min-w-0 pr-2">Extra Discount</span>
// // //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.extraDiscountAmount)}</span>
// // //               </div>
// // //             )}
// // //             {totals.extraDiscountAmount > 0 ? (
// // //               <div className="mt-1 flex items-start justify-between gap-3">
// // //                 <span className="min-w-0 pr-2">Taxable Amount (After Extra Discount)</span>
// // //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxable)}</span>
// // //               </div>
// // //             ) : (
// // //               <div className="flex items-start justify-between gap-3">
// // //                 <span className="min-w-0 pr-2">Taxable Amount</span>
// // //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxableBeforeExtraDiscount)}</span>
// // //               </div>
// // //             )}
// // //             <div className="mt-1 flex items-start justify-between gap-3">
// // //               <span className="min-w-0 pr-2">Tax</span>
// // //               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.tax)}</span>
// // //             </div>
// // //             <div className="mt-2 flex items-start justify-between gap-3 border-t border-slate-300 pt-2 text-[15px] font-semibold text-slate-950">
// // //               <span className="min-w-0 pr-2">Grand Total</span>
// // //               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
// // //             </div>
// // //             <div className="mt-3 flex items-start justify-between gap-3">
// // //               <span className="min-w-0 pr-2">Payment Mode</span>
// // //               <span className="ml-auto shrink-0 text-right">: {invoice.paymentMode || "—"}</span>
// // //             </div>
// // //             <div className="mt-1 flex items-start justify-between gap-3 font-semibold text-slate-900">
// // //               <span className="min-w-0 pr-2">Balance</span>
// // //               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Notes + Terms */}
// // //         <div className="border-b border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-700">
// // //           <div className="rounded-lg border border-slate-300 bg-white p-3">
// // //             <div className="font-semibold text-slate-900">Notes</div>
// // //             <div className="mt-1">{invoice.notes || "—"}</div>
// // //             <div className="mt-3 font-semibold text-slate-900">
// // //               Terms & Conditions
// // //             </div>
// // //             <div className="mt-1">{invoice.terms || "—"}</div>
// // //           </div>
// // //         </div>

// // //         {/* Bank Details + Signature */}
// // //         <div className="grid grid-cols-1 gap-4 bg-white p-4 sm:grid-cols-2 print:grid-cols-2">
// // //           <div>
// // //             <div className="invoice-card rounded-lg border border-slate-300 bg-slate-50 p-3">
// // //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// // //                 Bank Details:
// // //               </p>
// // //               <div className="mt-2 whitespace-pre-line text-[12px] text-slate-700">
// // //                 {invoice.bankDetails || "—"}
// // //               </div>
// // //             </div>
// // //           </div>
// // //           <div className="flex flex-col items-end justify-between text-[13px] text-slate-700">
// // //             <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
// // //               <div className="font-semibold text-slate-900">
// // //                 For Radiatech Electra:
// // //               </div>
// // //               <div className="mt-2 flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
// // //                 {invoice.signatureImage ? (
// // //                   <img
// // //                     src={invoice.signatureImage}
// // //                     alt="Authorized signature"
// // //                     className="h-full w-full object-contain"
// // //                   />
// // //                 ) : (
// // //                   "Signature"
// // //                 )}
// // //               </div>
// // //               <div className="mt-1 text-center text-[11px] font-semibold text-slate-700">
// // //                 {invoice.authorizedSignature || "Authorized Signatory"}
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <style jsx global>{`
// // //         @page {
// // //           size: A4;
// // //           margin: 6mm;
// // //         }

// // //         @media print {
// // //           html,
// // //           body {
// // //             width: 210mm !important;
// // //             height: 297mm !important;
// // //             background: white !important;
// // //             margin: 0 !important;
// // //             padding: 0 !important;
// // //           }
// // //           body * {
// // //             visibility: hidden !important;
// // //           }
// // //           .invoice-preview-shell,
// // //           .invoice-preview-shell * {
// // //             visibility: visible !important;
// // //             -webkit-print-color-adjust: exact !important;
// // //             print-color-adjust: exact !important;
// // //           }
// // //           .invoice-preview-shell {
// // //             position: static !important;
// // //             width: 100% !important;
// // //             max-width: none !important;
// // //             box-shadow: none !important;
// // //             border: none !important;
// // //             padding: 0 !important;
// // //             margin: 0 !important;
// // //             background: white !important;
// // //             overflow: visible !important;
// // //           }
// // //           .invoice-preview-shell > div {
// // //             width: 100% !important;
// // //             max-width: none !important;
// // //             min-height: 285mm !important;
// // //             box-shadow: none !important;
// // //             border: 1.2px solid #cbd5e1 !important;
// // //             border-radius: 0 !important;
// // //             box-sizing: border-box !important;
// // //             overflow: visible !important;
// // //           }
// // //           .invoice-preview-shell .invoice-card,
// // //           .invoice-preview-shell .invoice-table-wrap {
// // //             page-break-inside: avoid !important;
// // //             break-inside: avoid !important;
// // //           }
// // //           .print\:hidden {
// // //             display: none !important;
// // //           }
// // //         }
// // //       `}</style>
// // //     </section>
// // //   );
// // // }

// // "use client";

// // import type { InvoiceSummary } from "@/lib/invoiceRoute";
// // import { getBillTypeLabel } from "@/lib/invoiceRoute";
// // import { useMemo, useState } from "react";

// // type TaxType = "cgst-sgst" | "igst" | "none";

// // const ONES = [
// //   "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
// //   "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
// //   "Sixteen", "Seventeen", "Eighteen", "Nineteen",
// // ];
// // const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

// // function twoDigits(n: number): string {
// //   if (n < 20) return ONES[n];
// //   return `${TENS[Math.floor(n / 10)]}${ONES[n % 10] ? " " + ONES[n % 10] : ""}`;
// // }

// // function threeDigits(n: number): string {
// //   const parts: string[] = [];
// //   const hundreds = Math.floor(n / 100);
// //   const rest = n % 100;
// //   if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
// //   if (rest > 0) parts.push(twoDigits(rest));
// //   return parts.join(" ");
// // }

// // function numberToIndianWords(value: number): string {
// //   const rounded = Math.round(value);
// //   if (rounded === 0) return "Zero";

// //   const negative = rounded < 0;
// //   let n = Math.abs(rounded);

// //   const crore = Math.floor(n / 10000000);
// //   n %= 10000000;
// //   const lakh = Math.floor(n / 100000);
// //   n %= 100000;
// //   const thousand = Math.floor(n / 1000);
// //   n %= 1000;
// //   const rest = n;

// //   const parts: string[] = [];
// //   if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
// //   if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
// //   if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
// //   if (rest > 0) parts.push(threeDigits(rest));

// //   return `${negative ? "Minus " : ""}${parts.join(" ")} Only`;
// // }

// // const formatCurrency = (value?: number) =>
// //   `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// // const formatDate = (value?: string) => {
// //   if (!value) return "—";
// //   const date = new Date(value);
// //   return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
// // };

// // interface InvoicePreviewProps {
// //   invoice: InvoiceSummary;
// //   taxType?: TaxType;
// //   onTaxTypeChange?: (type: TaxType) => void;
// // }

// // export default function InvoicePreview({
// //   invoice,
// //   taxType: taxTypeProp,
// //   onTaxTypeChange,
// // }: InvoicePreviewProps) {
// //   const isInteractive = onTaxTypeChange !== undefined;
// //   const [internalTaxType, setInternalTaxType] = useState<TaxType>(
// //     (invoice.taxType as TaxType) || "cgst-sgst",
// //   );
// //   const taxType = taxTypeProp ?? internalTaxType;

// //   const items = invoice.items || [];
// //   const roundOff = Number(invoice.roundOff ?? 0);

// //   const shouldShowDiscountColumn = items.some(
// //     (item) => Number(item.discountPercent || 0) > 0,
// //   );

// //   const rows = useMemo(
// //     () =>
// //       items.map((item) => {
// //         const rate = Number(item.rate || 0);
// //         const qty = Number(item.qty || 0);
// //         const discountPercent = Number(item.discountPercent || 0);
// //         const taxPercent = Number(item.taxPercent || 0);

// //         const taxablePerUnit = rate * (1 - discountPercent / 100);
// //         const taxableAmount = qty * taxablePerUnit;
// //         const discountAmount = qty * rate * (discountPercent / 100);
// //         const gstAmount = taxableAmount * (taxPercent / 100);
// //         const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (taxPercent / 100);
// //         const rowAmount = taxableAmount + gstAmount;

// //         return {
// //           ...item,
// //           taxablePerUnit,
// //           taxableAmount,
// //           discountAmount,
// //           gstAmount,
// //           finalRatePerUnit,
// //           rowAmount,
// //           rate,
// //           qty,
// //           discountPercent,
// //           taxPercent,
// //         };
// //       }),
// //     [items],
// //   );

// //   const totals = useMemo(() => {
// //     const subtotal = rows.reduce((sum, r) => sum + r.qty * r.rate, 0);
// //     const discountTotal = rows.reduce((sum, r) => sum + r.discountAmount, 0);
// //     const taxableBeforeExtraDiscount = rows.reduce(
// //       (sum, r) => sum + r.taxableAmount,
// //       0,
// //     );
// //     const taxBeforeExtraDiscount = rows.reduce(
// //       (sum, r) => sum + r.gstAmount,
// //       0,
// //     );

// //     const extraDiscountAmount = Number(invoice.extraDiscountAmount || 0);
// //     const taxable =
// //       extraDiscountAmount > 0
// //         ? Math.max(0, taxableBeforeExtraDiscount - extraDiscountAmount)
// //         : taxableBeforeExtraDiscount;
// //     const tax =
// //       extraDiscountAmount > 0
// //         ? rows.reduce((sum, r) => {
// //             const ratio =
// //               taxableBeforeExtraDiscount > 0
// //                 ? r.taxableAmount / taxableBeforeExtraDiscount
// //                 : 0;
// //             return sum + r.gstAmount * ratio;
// //           }, 0)
// //         : taxBeforeExtraDiscount;

// //     const grandTotalBeforeRoundOff = taxable + tax;
// //     const grandTotal = grandTotalBeforeRoundOff + roundOff;

// //     const cgstRate =
// //       taxType === "cgst-sgst"
// //         ? rows.length > 0
// //           ? Number(rows[0].taxPercent || 0) / 2
// //           : 0
// //         : 0;
// //     const sgstRate = cgstRate;
// //     const igstRate =
// //       taxType === "igst"
// //         ? rows.length > 0
// //           ? Number(rows[0].taxPercent || 0)
// //           : 0
// //         : 0;

// //     const cgst = tax / 2;
// //     const sgst = tax / 2;
// //     const igst = tax;

// //     return {
// //       subtotal,
// //       discountTotal,
// //       taxableBeforeExtraDiscount,
// //       taxBeforeExtraDiscount,
// //       extraDiscountAmount,
// //       taxable,
// //       tax,
// //       roundOff,
// //       grandTotalBeforeRoundOff,
// //       grandTotal,
// //       cgstRate,
// //       sgstRate,
// //       igstRate,
// //       cgst,
// //       sgst,
// //       igst,
// //     };
// //   }, [rows, taxType, invoice.extraDiscountAmount, roundOff]);

// //   const handleTaxTypeChange = (value: TaxType) => {
// //     if (onTaxTypeChange) {
// //       onTaxTypeChange(value);
// //     } else {
// //       setInternalTaxType(value);
// //     }
// //   };

// //   const renderCompactMetricCell = (amount: number, rate: number) => {
// //     if (rate <= 0) return <span className="text-slate-400">—</span>;
// //     return (
// //       <span>
// //         {formatCurrency(amount)}
// //         <span className="ml-1 text-[10px] text-slate-400">
// //           ({rate.toFixed(2)}%)
// //         </span>
// //       </span>
// //     );
// //   };

// //   const docLabel = getBillTypeLabel(invoice);
  
// //   // Conditional check to determine if the notes/terms section should show up
// //   const hasNotesOrTerms = !!(invoice.notes?.trim() || invoice.terms?.trim());

// //   return (
// //     <section className="invoice-preview-shell rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0">
// //       <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:min-h-[297mm] print:rounded-none print:border-0 print:shadow-none print:bg-white">
// //         {/* Header bar */}
// //         <div className="flex items-center justify-between border-b border-slate-300 bg-[#f7f9fc] px-6 py-3 print:px-5">
// //           <h2 className="text-base font-semibold capitalize text-slate-900">
// //             {docLabel}
// //           </h2>
// //           <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// //             Original for Recipient
// //           </span>
// //         </div>

// //         {/* Company row */}
// //         <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 pb-4 pt-4 print:px-5">
// //           <div className="flex items-start gap-3">
// //             <div className="flex h-12 w-12 items-center justify-center rounded-md text-sm font-bold text-white">
// //               <img src="/favicon.png" alt="Company Logo" />
// //             </div>
// //             <div>
// //               <h3 className="text-xl font-bold tracking-wide text-slate-950">
// //                 RADIATECH ELECTRA
// //               </h3>
// //               <p className="mt-1 text-[11px] text-slate-600">
// //                 Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar
// //                 Pradesh, 201301
// //               </p>
// //             </div>
// //           </div>
// //           <div className="text-right text-[11px] text-slate-600">
// //             <div>Phone: +91 81788 50959</div>
// //             <div>Email: sales@radiatech.in</div>
// //             <div>GSTIN: 09DDZPK0004H1ZF</div>
// //             <div>State: 09-Uttar Pradesh</div>
// //           </div>
// //         </div>

// //         {/* Bill To + Invoice Details */}
// //         <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
// //           <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
// //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// //                 Bill To:
// //               </p>
// //               <div className="mt-1 text-[13px] leading-5 text-slate-800">
// //                 <div className="font-semibold text-slate-900">
// //                   {invoice.partyName || "—"}
// //                 </div>
// //                 {invoice.contactPerson ? (
// //                   <div>Attn: {invoice.contactPerson}</div>
// //                 ) : null}
// //                 <div>{invoice.address || "—"}</div>
// //                 <div>
// //                   {[invoice.city, invoice.state, invoice.pincode]
// //                     .filter(Boolean)
// //                     .join(", ") || "—"}
// //                 </div>
// //                 <div>Contact No: {invoice.phone || "—"}</div>
// //                 <div>Email: {invoice.email || "—"}</div>
// //                 <div>GSTIN: {invoice.gstin || "—"}</div>
// //               </div>
// //             </div>
// //           </div>
// //           <div className="bg-white p-4">
// //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// //                 Invoice Details:
// //               </p>
// //               <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[13px] text-slate-800">
// //                 <span className="font-semibold text-slate-900">Invoice No:</span>
// //                 <span>{invoice.invoiceNumber || "—"}</span>
// //                 <span className="font-semibold text-slate-900">Date:</span>
// //                 <span>
// //                   {formatDate(invoice.invoiceDate || invoice.createdAt)}
// //                 </span>
// //                 <span className="font-semibold text-slate-900">PO Date:</span>
// //                 <span>{formatDate(invoice.poDate || undefined)}</span>
// //                 <span className="font-semibold text-slate-900">
// //                   E-way Bill No:
// //                 </span>
// //                 <span>{invoice.ewayBillNo || "—"}</span>
// //                 <span className="font-semibold text-slate-900">PO No:</span>
// //                 <span>{invoice.poNo || "—"}</span>
// //                 <span className="font-semibold text-slate-900">
// //                   Reference No:
// //                 </span>
// //                 <span>{invoice.placeOfSupply || "—"}</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Ship To + Transportation Details */}
// //         <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
// //           <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
// //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// //                 Ship To:
// //               </p>
// //               <div className="mt-1 whitespace-pre-line text-[13px] text-slate-800">
// //                 {invoice.shipToAddress || "—"}
// //               </div>
// //             </div>
// //           </div>
// //           <div className="bg-white p-4">
// //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
// //                 Transportation Details:
// //               </p>
// //               <div className="mt-1 text-[13px] text-slate-800">
// //                 <div>Transport Name: {invoice.transportName || "—"}</div>
// //                 <div>Vehicle Number: {invoice.vehicleNumber || "—"}</div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Items table */}
// //         <div className="invoice-table-wrap overflow-hidden border-b border-slate-300">
// //           <table className="w-full border-collapse text-[12px]">
// //             <thead>
// //               <tr className="bg-[#bec9d9] text-left text-slate-700">
// //                 <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
// //                 <th className="border border-slate-300 px-2 py-2 font-semibold">Item name</th>
// //                 <th className="border border-slate-300 px-2 py-2 font-semibold">HSN/SAC</th>
// //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Quantity</th>
// //                 <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
// //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Price/unit (Rs)</th>
// //                 {shouldShowDiscountColumn && (
// //                   <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Discount</th>
// //                 )}
// //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable Price/unit (Rs)</th>
// //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable amount (Rs)</th>
// //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">GST</th>
// //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Final Rate (Rs)</th>
// //                 <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Amount Total (Rs)</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {rows.map((item, index) => (
// //                 <tr key={item.id || index}>
// //                   <td className="border border-slate-300 px-2 py-2 align-top">{index + 1}</td>
// //                   <td className="border border-slate-300 px-2 py-2 align-top">{item.description || "Item description"}</td>
// //                   <td className="border border-slate-300 px-2 py-2 align-top">{item.hsn || "—"}</td>
// //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">{item.qty}</td>
// //                   <td className="border border-slate-300 px-2 py-2 align-top">{item.unit || "—"}</td>
// //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(item.rate)}</td>
// //                   {shouldShowDiscountColumn && (
// //                     <td className="border border-slate-300 px-2 py-2 text-right align-top">
// //                       {renderCompactMetricCell(item.discountAmount, item.discountPercent)}
// //                     </td>
// //                   )}
// //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(item.taxablePerUnit)}</td>
// //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(item.taxableAmount)}</td>
// //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">{renderCompactMetricCell(item.gstAmount, item.taxPercent)}</td>
// //                   <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(item.finalRatePerUnit)}</td>
// //                   <td className="border border-slate-300 px-2 py-2 text-right align-top font-semibold text-slate-900">{formatCurrency(item.rowAmount)}</td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //             <tfoot>
// //               <tr className="bg-slate-50 font-semibold text-slate-900">
// //                 <td className="border border-slate-300 px-2 py-2" colSpan={3}>Total</td>
// //                 <td className="border border-slate-300 px-2 py-2 text-right">{rows.reduce((sum, item) => sum + item.qty, 0)}</td>
// //                 <td className="border border-slate-300 px-2 py-2" />
// //                 <td className="border border-slate-300 px-2 py-2" />
// //                 {shouldShowDiscountColumn && (
// //                   <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.discountTotal)}</td>
// //                 )}
// //                 <td className="border border-slate-300 px-2 py-2" />
// //                 <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
// //                 <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
// //                 <td className="border border-slate-300 px-2 py-2" />
// //                 <td className="border border-slate-300 px-2 py-2 text-right">
// //                   {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
// //                 </td>
// //               </tr>
// //             </tfoot>
// //           </table>
// //         </div>

// //         {/* Tax Summary + Totals */}
// //         <div className="grid grid-cols-1 border-b border-slate-300 bg-white md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
// //           <div className="min-w-0 border-b border-slate-300 bg-slate-50 p-4 md:border-b-0 md:border-r">
// //             <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
// //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Summary:</p>
// //               <label className="mt-2 mb-2 block">
// //                 <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Option</span>
// //                 <select
// //                   value={taxType}
// //                   onChange={(event) => handleTaxTypeChange(event.target.value as TaxType)}
// //                   disabled={!isInteractive}
// //                   className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[12px] text-slate-700 disabled:opacity-60"
// //                 >
// //                   <option value="cgst-sgst">CGST + SGST</option>
// //                   <option value="igst">IGST</option>
// //                   <option value="none">No Tax</option>
// //                 </select>
// //               </label>
// //               <div className="mt-2 overflow-x-auto">
// //                 <table className="min-w-[520px] w-full border-collapse text-[11px]">
// //                   <thead>
// //                     <tr className="bg-slate-100 text-left text-slate-600">
// //                       <th className="border border-slate-300 px-2 py-1 font-semibold">Taxable</th>
// //                       {taxType === "cgst-sgst" ? (
// //                         <>
// //                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Rate)</th>
// //                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Amt)</th>
// //                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Rate)</th>
// //                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Amt)</th>
// //                         </>
// //                       ) : taxType === "igst" ? (
// //                         <>
// //                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Rate)</th>
// //                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Amt)</th>
// //                         </>
// //                       ) : null}
// //                       <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Total Tax</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     <tr className="bg-[#fbfcfe]">
// //                       <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-900">{formatCurrency(totals.taxable)}</td>
// //                       {taxType === "cgst-sgst" ? (
// //                         <>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{totals.cgstRate.toFixed(2)}%</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{totals.sgstRate.toFixed(2)}%</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
// //                         </>
// //                       ) : taxType === "igst" ? (
// //                         <>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{totals.igstRate.toFixed(2)}%</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
// //                         </>
// //                       ) : null}
// //                       <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
// //                     </tr>
// //                     <tr className="bg-[#ce9b24] font-semibold text-slate-900">
// //                       <td className="border border-slate-300 px-2 py-1">TOTAL</td>
// //                       {taxType === "cgst-sgst" ? (
// //                         <>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">—</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">—</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
// //                         </>
// //                       ) : taxType === "igst" ? (
// //                         <>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">—</td>
// //                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
// //                         </>
// //                       ) : null}
// //                       <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
// //                     </tr>
// //                   </tbody>
// //                 </table>
// //               </div>
// //               <div className="mt-3 text-[12px] text-slate-700">
// //                 <span className="font-semibold text-slate-900">Invoice Amount in Words: </span>
// //                 {numberToIndianWords(totals.grandTotal)}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="min-w-0 bg-white p-4 text-[13px] text-slate-800">
// //             {totals.discountTotal > 0 && (
// //               <div className="mt-1 flex items-start justify-between gap-3">
// //                 <span className="min-w-0 pr-2">Item-wise Discount</span>
// //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.discountTotal)}</span>
// //               </div>
// //             )}
// //             {totals.extraDiscountAmount > 0 && (
// //               <div className="mt-1 flex items-start justify-between gap-3 text-amber-700">
// //                 <span className="min-w-0 pr-2">Discount on Taxable Amount</span>
// //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.extraDiscountAmount)}</span>
// //               </div>
// //             )}
// //             {totals.extraDiscountAmount > 0 ? (
// //               <div className="mt-1 flex items-start justify-between gap-3">
// //                 <span className="min-w-0 pr-2">Taxable Amount (After Extra Discount)</span>
// //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxable)}</span>
// //               </div>
// //             ) : (
// //               <div className="flex items-start justify-between gap-3">
// //                 <span className="min-w-0 pr-2">Taxable Amount</span>
// //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxableBeforeExtraDiscount)}</span>
// //               </div>
// //             )}
// //             <div className="mt-1 flex items-start justify-between gap-3">
// //               <span className="min-w-0 pr-2">Tax</span>
// //               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.tax)}</span>
// //             </div>
// //             {Math.abs(totals.roundOff) > 0 && (
// //               <div className="mt-1 flex items-start justify-between gap-3">
// //                 <span className="min-w-0 pr-2">Round Off</span>
// //                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.roundOff)}</span>
// //               </div>
// //             )}
// //             <div className="mt-2 flex items-start justify-between gap-3 border-t border-slate-300 pt-2 text-[15px] font-semibold text-slate-950">
// //               <span className="min-w-0 pr-2">Grand Total</span>
// //               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
// //             </div>
// //             <div className="mt-3 flex items-start justify-between gap-3">
// //               <span className="min-w-0 pr-2">Payment Mode</span>
// //               <span className="ml-auto shrink-0 text-right">: {invoice.paymentMode || "—"}</span>
// //             </div>
// //             <div className="mt-1 flex items-start justify-between gap-3 font-semibold text-slate-900">
// //               <span className="min-w-0 pr-2">Balance</span>
// //               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Notes + Terms (Conditionally rendered to adapt layout) */}
// //         {hasNotesOrTerms && (
// //           <div className="border-b border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-700">
// //             <div className="rounded-lg border border-slate-300 bg-white p-3">
// //               {invoice.notes?.trim() && (
// //                 <>
// //                   <div className="font-semibold text-slate-900">Notes</div>
// //                   <div className="mt-1 mb-3 last:mb-0">{invoice.notes}</div>
// //                 </>
// //               )}
// //               {invoice.terms?.trim() && (
// //                 <>
// //                   <div className="font-semibold text-slate-900">Terms & Conditions</div>
// //                   <div className="mt-1">{invoice.terms}</div>
// //                 </>
// //               )}
// //             </div>
// //           </div>
// //         )}

// //         {/* Bank Details + Signature */}
// //         <div className="grid grid-cols-1 gap-4 bg-white p-4 sm:grid-cols-2 print:grid-cols-2">
// //           <div>
// //             <div className="invoice-card rounded-lg border border-slate-300 bg-slate-50 p-3">
// //               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bank Details:</p>
// //               <div className="mt-2 whitespace-pre-line text-[12px] text-slate-700">
// //                 {invoice.bankDetails || "—"}
// //               </div>
// //             </div>
// //           </div>
// //           <div className="flex flex-col items-end justify-between text-[13px] text-slate-700">
// //             <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
// //               <div className="font-semibold text-slate-900">For Radiatech Electra:</div>
// //               <div className="mt-2 flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
// //                 {invoice.signatureImage ? (
// //                   <img src={invoice.signatureImage} alt="Authorized signature" className="h-full w-full object-contain" />
// //                 ) : (
// //                   "Signature"
// //                 )}
// //               </div>
// //               <div className="mt-1 text-center text-[11px] font-semibold text-slate-700">
// //                 {invoice.authorizedSignature || "Authorized Signatory"}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <style jsx global>{`
// //         @page {
// //           size: A4;
// //           margin: 6mm;
// //         }

// //         @media print {
// //           html,
// //           body {
// //             width: 210mm !important;
// //             height: 297mm !important;
// //             background: white !important;
// //             margin: 0 !important;
// //             padding: 0 !important;
// //           }
// //           body * {
// //             visibility: hidden !important;
// //           }
// //           .invoice-preview-shell,
// //           .invoice-preview-shell * {
// //             visibility: visible !important;
// //             -webkit-print-color-adjust: exact !important;
// //             print-color-adjust: exact !important;
// //           }
// //           .invoice-preview-shell {
// //             position: static !important;
// //             width: 100% !important;
// //             max-width: none !important;
// //             box-shadow: none !important;
// //             border: none !important;
// //             padding: 0 !important;
// //             margin: 0 !important;
// //             background: white !important;
// //             overflow: visible !important;
// //           }
// //           .invoice-preview-shell > div {
// //             width: 100% !important;
// //             max-width: none !important;
// //             min-height: 285mm !important;
// //             box-shadow: none !important;
// //             border: 1.2px solid #cbd5e1 !important;
// //             border-radius: 0 !important;
// //             box-sizing: border-box !important;
// //             overflow: visible !important;
// //           }
// //           .invoice-preview-shell .invoice-card,
// //           .invoice-preview-shell .invoice-table-wrap {
// //             page-break-inside: avoid !important;
// //             break-inside: avoid !important;
// //           }
// //           .print\:hidden {
// //             display: none !important;
// //           }
// //         }
// //       `}</style>
// //     </section>
// //   );
// // }




// "use client";

// import type { InvoiceSummary } from "@/lib/invoiceRoute";
// import { getBillTypeLabel } from "@/lib/invoiceRoute";
// import { useMemo, useState } from "react";

// type TaxType = "cgst-sgst" | "igst" | "none";

// const ONES = [
//   "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
//   "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
//   "Sixteen", "Seventeen", "Eighteen", "Nineteen",
// ];
// const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

// function twoDigits(n: number): string {
//   if (n < 20) return ONES[n];
//   return `${TENS[Math.floor(n / 10)]}${ONES[n % 10] ? " " + ONES[n % 10] : ""}`;
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
//   if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
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

//   const items = invoice.items || [];
//   const roundOff = Number(invoice.roundOff || 0);

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
//     const subtotal = rows.reduce((sum, r) => sum + r.qty * r.rate, 0);
//     const discountTotal = rows.reduce((sum, r) => sum + r.discountAmount, 0);
//     const taxableBeforeExtraDiscount = rows.reduce(
//       (sum, r) => sum + r.taxableAmount,
//       0,
//     );
//     const taxBeforeExtraDiscount = rows.reduce(
//       (sum, r) => sum + r.gstAmount,
//       0,
//     );

//     const extraDiscountAmount = Number(invoice.extraDiscountAmount || 0);
//     const taxable =
//       extraDiscountAmount > 0
//         ? Math.max(0, taxableBeforeExtraDiscount - extraDiscountAmount)
//         : taxableBeforeExtraDiscount;
//     const tax =
//       extraDiscountAmount > 0
//         ? rows.reduce((sum, r) => {
//             const ratio =
//               taxableBeforeExtraDiscount > 0
//                 ? r.taxableAmount / taxableBeforeExtraDiscount
//                 : 0;
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
//       subtotal,
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

//   // Stacks the % below the ₹ amount instead of putting them side-by-side,
//   // so this never needs more horizontal room than its (narrow) column has —
//   // that inline "₹X (Y%)" layout was previously wide enough to spill into
//   // the next column under table-fixed, which is what caused the overlap.
//   const renderCompactMetricCell = (amount: number, rate: number) => {
//     if (rate <= 0) return <span className="text-slate-400">—</span>;
//     return (
//       <span className="flex flex-col items-end leading-tight">
//         <span>{formatCurrency(amount)}</span>
//         <span className="text-[9px] text-slate-400">({rate.toFixed(2)}%)</span>
//       </span>
//     );
//   };

//   const docLabel = getBillTypeLabel(invoice);
  
//   // Conditional check to determine if the notes/terms section should show up
//   const hasNotesOrTerms = !!(invoice.notes?.trim() || invoice.terms?.trim());

//   return (
//     <section className="invoice-preview-shell rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0">
//       <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:min-h-[297mm] print:rounded-none print:border-0 print:shadow-none print:bg-white">
//         {/* Header bar */}
//         <div className="flex items-center justify-between border-b border-slate-300 bg-[#f7f9fc] px-6 py-3 print:px-5">
//           <h2 className="text-base font-semibold capitalize text-slate-900">
//             {docLabel}
//           </h2>
//           <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//             Original for Recipient
//           </span>
//         </div>

//         {/* Company row */}
//         <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 pb-4 pt-4 print:px-5">
//           <div className="flex items-start gap-3">
//             <div className="flex h-12 w-12 items-center justify-center rounded-md text-sm font-bold text-white">
//               <img src="/favicon.png" alt="Company Logo" />
//             </div>
//             <div>
//               <h3 className="text-xl font-bold tracking-wide text-slate-950">
//                 RADIATECH ELECTRA
//               </h3>
//               <p className="mt-1 text-[11px] text-slate-600">
//                 Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar
//                 Pradesh, 201301
//               </p>
//             </div>
//           </div>
//           <div className="text-right text-[11px] text-slate-600">
//             <div>Phone: +91 81788 50959</div>
//             <div>Email: sales@radiatech.in</div>
//             <div>GSTIN: 09DDZPK0004H1ZF</div>
//             <div>State: 09-Uttar Pradesh</div>
//           </div>
//         </div>

//         {/* Bill To + Invoice Details */}
//         <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
//           <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
//             <div className="rounded-lg border border-slate-300 bg-white p-3">
//               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//                 Bill To:
//               </p>
//               <div className="mt-1 text-[13px] leading-5 text-slate-800">
//                 <div className="font-semibold text-slate-900">
//                   {invoice.partyName || "—"}
//                 </div>
//                 {invoice.contactPerson ? (
//                   <div>Attn: {invoice.contactPerson}</div>
//                 ) : null}
//                 <div>{invoice.address || "—"}</div>
//                 <div>
//                   {[invoice.city, invoice.state, invoice.pincode]
//                     .filter(Boolean)
//                     .join(", ") || "—"}
//                 </div>
//                 <div>Contact No: {invoice.phone || "—"}</div>
//                 <div>Email: {invoice.email || "—"}</div>
//                 <div>GSTIN: {invoice.gstin || "—"}</div>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-4">
//             <div className="rounded-lg border border-slate-300 bg-white p-3">
//               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//                 Invoice Details:
//               </p>
//               <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[13px] text-slate-800">
//                 <span className="font-semibold text-slate-900">Invoice No:</span>
//                 <span>{invoice.invoiceNumber || "—"}</span>
//                 <span className="font-semibold text-slate-900">Date:</span>
//                 <span>
//                   {formatDate(invoice.invoiceDate || invoice.createdAt)}
//                 </span>
//                 <span className="font-semibold text-slate-900">PO Date:</span>
//                 <span>{formatDate(invoice.poDate || undefined)}</span>
//                 <span className="font-semibold text-slate-900">
//                   E-way Bill No:
//                 </span>
//                 <span>{invoice.ewayBillNo || "—"}</span>
//                 <span className="font-semibold text-slate-900">PO No:</span>
//                 <span>{invoice.poNo || "—"}</span>
//                 <span className="font-semibold text-slate-900">
//                   Reference No:
//                 </span>
//                 <span>{invoice.placeOfSupply || "—"}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Ship To + Transportation Details */}
//         <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
//           <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
//             <div className="rounded-lg border border-slate-300 bg-white p-3">
//               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//                 Ship To:
//               </p>
//               <div className="mt-1 whitespace-pre-line text-[13px] text-slate-800">
//                 {invoice.shipToAddress || "—"}
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-4">
//             <div className="rounded-lg border border-slate-300 bg-white p-3">
//               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//                 Transportation Details:
//               </p>
//               <div className="mt-1 text-[13px] text-slate-800">
//                 <div>Transport Name: {invoice.transportName || "—"}</div>
//                 <div>Vehicle Number: {invoice.vehicleNumber || "—"}</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Items table */}
//         <div className="invoice-table-wrap overflow-x-auto border-b border-slate-300">
//           <table className="w-full table-fixed border-collapse text-[10.5px] print:text-[9px]">
//             {shouldShowDiscountColumn ? (
//               <colgroup>
//                 <col className="w-[3%]" />
//                 <col className="w-[18%]" />
//                 <col className="w-[7%]" />
//                 <col className="w-[6%]" />
//                 <col className="w-[5%]" />
//                 <col className="w-[8%]" />
//                 <col className="w-[8%]" />
//                 <col className="w-[8%]" />
//                 <col className="w-[9%]" />
//                 <col className="w-[9%]" />
//                 <col className="w-[9%]" />
//                 <col className="w-[10%]" />
//               </colgroup>
//             ) : (
//               <colgroup>
//                 <col className="w-[3%]" />
//                 <col className="w-[20%]" />
//                 <col className="w-[8%]" />
//                 <col className="w-[6%]" />
//                 <col className="w-[5%]" />
//                 <col className="w-[9%]" />
//                 <col className="w-[9%]" />
//                 <col className="w-[10%]" />
//                 <col className="w-[10%]" />
//                 <col className="w-[10%]" />
//                 <col className="w-[10%]" />
//               </colgroup>
//             )}
//             <thead>
//               <tr className="bg-[#bec9d9] text-left text-slate-700">
//                 <th className="border border-slate-300 px-1.5 py-2 font-semibold">#</th>
//                 <th className="border border-slate-300 px-1.5 py-2 font-semibold">Item name</th>
//                 <th className="border border-slate-300 px-1.5 py-2 font-semibold">HSN/SAC</th>
//                 <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Qty</th>
//                 <th className="border border-slate-300 px-1.5 py-2 font-semibold">Unit</th>
//                 <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Price/unit</th>
//                 {shouldShowDiscountColumn && (
//                   <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Discount</th>
//                 )}
//                 <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable Price/unit</th>
//                 <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable amount</th>
//                 <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">GST</th>
//                 <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Final Rate</th>
//                 <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Amount Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((item, index) => (
//                 <tr key={item.id || index}>
//                   <td className="border border-slate-300 px-1.5 py-2 align-top">{index + 1}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 align-top break-words whitespace-normal">{item.description || "Item description"}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 align-top break-words whitespace-normal">{item.hsn || "—"}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 text-right align-top">{item.qty}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 align-top">{item.unit || "—"}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 text-right align-top">{formatCurrency(item.rate)}</td>
//                   {shouldShowDiscountColumn && (
//                     <td className="border border-slate-300 px-1.5 py-2 text-right align-top">
//                       {renderCompactMetricCell(item.discountAmount, item.discountPercent)}
//                     </td>
//                   )}
//                   <td className="border border-slate-300 px-1.5 py-2 text-right align-top">{formatCurrency(item.taxablePerUnit)}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 text-right align-top">{formatCurrency(item.taxableAmount)}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 text-right align-top">{renderCompactMetricCell(item.gstAmount, item.taxPercent)}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 text-right align-top">{formatCurrency(item.finalRatePerUnit)}</td>
//                   <td className="border border-slate-300 px-1.5 py-2 text-right align-top font-semibold text-slate-900">{formatCurrency(item.rowAmount)}</td>
//                 </tr>
//               ))}
//             </tbody>
//             <tfoot>
//               {/*
//                 IMPORTANT: this row must render exactly as many <td>s (counting
//                 colSpan) as the <thead> above, in the same column order, or
//                 every total silently shifts left by one column — which is
//                 what was causing totals to visually collide with the wrong
//                 header/column. Column order here:
//                   1-3: # / Item name / HSN/SAC   -> colSpan={3} "Total"
//                   4:   Quantity                   -> summed qty
//                   5:   Unit                        -> blank
//                   6:   Price/unit                  -> blank (per-unit, no total)
//                   7:   Discount (only if shown)    -> discount total
//                   8:   Taxable Price/unit          -> blank (per-unit, no total)
//                   9:   Taxable amount              -> taxable total
//                   10:  GST                         -> tax total
//                   11:  Final Rate                  -> blank (per-unit, no total)
//                   12:  Amount Total                -> grand total (pre round-off)
//               */}
//               <tr className="bg-slate-50 font-semibold text-slate-900">
//                 <td className="border border-slate-300 px-1.5 py-2" colSpan={3}>Total</td>
//                 <td className="border border-slate-300 px-1.5 py-2 text-right">{rows.reduce((sum, item) => sum + item.qty, 0)}</td>
//                 <td className="border border-slate-300 px-1.5 py-2" />
//                 <td className="border border-slate-300 px-1.5 py-2" />
//                 {shouldShowDiscountColumn && (
//                   <td className="border border-slate-300 px-1.5 py-2 text-right">{formatCurrency(totals.discountTotal)}</td>
//                 )}
//                 <td className="border border-slate-300 px-1.5 py-2" />
//                 <td className="border border-slate-300 px-1.5 py-2 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
//                 <td className="border border-slate-300 px-1.5 py-2 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
//                 <td className="border border-slate-300 px-1.5 py-2" />
//                 <td className="border border-slate-300 px-1.5 py-2 text-right">
//                   {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
//                 </td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>

//         {/* Tax Summary + Totals */}
//         <div className="grid grid-cols-1 border-b border-slate-300 bg-white md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
//           <div className="min-w-0 border-b border-slate-300 bg-slate-50 p-4 md:border-b-0 md:border-r">
//             <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
//               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Summary:</p>
//               <label className="mt-2 mb-2 block">
//                 <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Option</span>
//                 <select
//                   value={taxType}
//                   onChange={(event) => handleTaxTypeChange(event.target.value as TaxType)}
//                   disabled={!isInteractive}
//                   className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[12px] text-slate-700 disabled:opacity-60"
//                 >
//                   <option value="cgst-sgst">CGST + SGST</option>
//                   <option value="igst">IGST</option>
//                   <option value="none">No Tax</option>
//                 </select>
//               </label>
//               <div className="mt-2 overflow-x-auto">
//                 <table className="w-full border-collapse text-[11px]">
//                   <thead>
//                     <tr className="bg-slate-100 text-left text-slate-600">
//                       <th className="border border-slate-300 px-2 py-1 font-semibold">Taxable</th>
//                       {taxType === "cgst-sgst" ? (
//                         <>
//                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Rate)</th>
//                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Amt)</th>
//                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Rate)</th>
//                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Amt)</th>
//                         </>
//                       ) : taxType === "igst" ? (
//                         <>
//                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Rate)</th>
//                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Amt)</th>
//                         </>
//                       ) : null}
//                       <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Total Tax</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr className="bg-[#fbfcfe]">
//                       <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-900">{formatCurrency(totals.taxable)}</td>
//                       {taxType === "cgst-sgst" ? (
//                         <>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{totals.cgstRate.toFixed(2)}%</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{totals.sgstRate.toFixed(2)}%</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
//                         </>
//                       ) : taxType === "igst" ? (
//                         <>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{totals.igstRate.toFixed(2)}%</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
//                         </>
//                       ) : null}
//                       <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
//                     </tr>
//                     <tr className="bg-[#ce9b24] font-semibold text-slate-900">
//                       <td className="border border-slate-300 px-2 py-1">TOTAL</td>
//                       {taxType === "cgst-sgst" ? (
//                         <>
//                           <td className="border border-slate-300 px-2 py-1 text-right">—</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">—</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
//                         </>
//                       ) : taxType === "igst" ? (
//                         <>
//                           <td className="border border-slate-300 px-2 py-1 text-right">—</td>
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
//                         </>
//                       ) : null}
//                       <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//               <div className="mt-3 text-[12px] text-slate-700">
//                 <span className="font-semibold text-slate-900">Invoice Amount in Words: </span>
//                 {numberToIndianWords(totals.grandTotal)}
//               </div>
//             </div>
//           </div>

//           <div className="min-w-0 bg-white p-4 text-[13px] text-slate-800">
//             {totals.discountTotal > 0 && (
//               <div className="mt-1 flex items-start justify-between gap-3">
//                 <span className="min-w-0 pr-2">Item-wise Discount</span>
//                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.discountTotal)}</span>
//               </div>
//             )}
//             {totals.extraDiscountAmount > 0 && (
//               <div className="mt-1 flex items-start justify-between gap-3 text-amber-700">
//                 <span className="min-w-0 pr-2">Discount on Taxable Amount</span>
//                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.extraDiscountAmount)}</span>
//               </div>
//             )}
//             {totals.extraDiscountAmount > 0 ? (
//               <div className="mt-1 flex items-start justify-between gap-3">
//                 <span className="min-w-0 pr-2">Taxable Amount (After Extra Discount)</span>
//                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxable)}</span>
//               </div>
//             ) : (
//               <div className="flex items-start justify-between gap-3">
//                 <span className="min-w-0 pr-2">Taxable Amount</span>
//                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxableBeforeExtraDiscount)}</span>
//               </div>
//             )}
//             <div className="mt-1 flex items-start justify-between gap-3">
//               <span className="min-w-0 pr-2">Tax</span>
//               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.tax)}</span>
//             </div>
//             {Math.abs(totals.roundOff) > 0 && (
//               <div className="mt-1 flex items-start justify-between gap-3">
//                 <span className="min-w-0 pr-2">Round Off</span>
//                 <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.roundOff)}</span>
//               </div>
//             )}
//             <div className="mt-2 flex items-start justify-between gap-3 border-t border-slate-300 pt-2 text-[15px] font-semibold text-slate-950">
//               <span className="min-w-0 pr-2">Grand Total</span>
//               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
//             </div>
//             <div className="mt-3 flex items-start justify-between gap-3">
//               <span className="min-w-0 pr-2">Payment Mode</span>
//               <span className="ml-auto shrink-0 text-right">: {invoice.paymentMode || "—"}</span>
//             </div>
//             <div className="mt-1 flex items-start justify-between gap-3 font-semibold text-slate-900">
//               <span className="min-w-0 pr-2">Balance</span>
//               <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
//             </div>
//           </div>
//         </div>

//         {/* Notes + Terms (Conditionally rendered to adapt layout) */}
//         {hasNotesOrTerms && (
//           <div className="border-b border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-700">
//             <div className="rounded-lg border border-slate-300 bg-white p-3">
//               {invoice.notes?.trim() && (
//                 <>
//                   <div className="font-semibold text-slate-900">Notes</div>
//                   <div className="mt-1 mb-3 last:mb-0">{invoice.notes}</div>
//                 </>
//               )}
//               {invoice.terms?.trim() && (
//                 <>
//                   <div className="font-semibold text-slate-900">Terms & Conditions</div>
//                   <div className="mt-1">{invoice.terms}</div>
//                 </>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Bank Details + Signature */}
//         <div className="grid grid-cols-1 gap-4 bg-white p-4 sm:grid-cols-2 print:grid-cols-2">
//           <div>
//             <div className="invoice-card rounded-lg border border-slate-300 bg-slate-50 p-3">
//               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bank Details:</p>
//               <div className="mt-2 whitespace-pre-line text-[12px] text-slate-700">
//                 {invoice.bankDetails || "—"}
//               </div>
//             </div>
//           </div>
//           <div className="flex flex-col items-end justify-between text-[13px] text-slate-700">
//             <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
//               <div className="font-semibold text-slate-900">For Radiatech Electra:</div>
//               <div className="mt-2 flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
//                 {invoice.signatureImage ? (
//                   <img src={invoice.signatureImage} alt="Authorized signature" className="h-full w-full object-contain" />
//                 ) : (
//                   "Signature"
//                 )}
//               </div>
//               <div className="mt-1 text-center text-[11px] font-semibold text-slate-700">
//                 {invoice.authorizedSignature || "Authorized Signatory"}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style jsx global>{`
//         @page {
//           size: A4;
//           margin: 6mm;
//         }

//         @media print {
//           html,
//           body {
//             width: 210mm !important;
//             height: 297mm !important;
//             background: white !important;
//             margin: 0 !important;
//             padding: 0 !important;
//           }
//           body * {
//             visibility: hidden !important;
//           }
//           .invoice-preview-shell,
//           .invoice-preview-shell * {
//             visibility: visible !important;
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//           .invoice-preview-shell {
//             position: static !important;
//             width: 100% !important;
//             max-width: none !important;
//             box-shadow: none !important;
//             border: none !important;
//             padding: 0 !important;
//             margin: 0 !important;
//             background: white !important;
//             overflow: visible !important;
//           }
//           .invoice-preview-shell > div {
//             width: 100% !important;
//             max-width: none !important;
//             min-height: 285mm !important;
//             box-shadow: none !important;
//             border: 1.2px solid #cbd5e1 !important;
//             border-radius: 0 !important;
//             box-sizing: border-box !important;
//             overflow: visible !important;
//           }
//           .invoice-preview-shell .invoice-card,
//           .invoice-preview-shell .invoice-table-wrap {
//             page-break-inside: avoid !important;
//             break-inside: avoid !important;
//           }
//           .print\:hidden {
//             display: none !important;
//           }
//         }
//       `}</style>
//     </section>
//   );
// }

"use client";

import type { InvoiceSummary } from "@/lib/invoiceRoute";
import { getBillTypeLabel, getDuplicateCopyInvoiceNumber, getDuplicateCopyPageLabels, getInvoiceDuplicateFlag } from "@/lib/invoiceRoute";
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

  const items = invoice.items || [];
  const roundOff = Number(invoice.roundOff || 0);

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
    const subtotal = rows.reduce((sum, r) => sum + r.qty * r.rate, 0);
    const discountTotal = rows.reduce((sum, r) => sum + r.discountAmount, 0);
    const taxableBeforeExtraDiscount = rows.reduce(
      (sum, r) => sum + r.taxableAmount,
      0,
    );
    const taxBeforeExtraDiscount = rows.reduce(
      (sum, r) => sum + r.gstAmount,
      0,
    );

    const extraDiscountAmount = Number(invoice.extraDiscountAmount || 0);
    const taxable =
      extraDiscountAmount > 0
        ? Math.max(0, taxableBeforeExtraDiscount - extraDiscountAmount)
        : taxableBeforeExtraDiscount;
    const tax =
      extraDiscountAmount > 0
        ? rows.reduce((sum, r) => {
            const ratio =
              taxableBeforeExtraDiscount > 0
                ? r.taxableAmount / taxableBeforeExtraDiscount
                : 0;
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
  const hasNotesOrTerms = !!(invoice.notes?.trim() || invoice.terms?.trim());
  const isDuplicateCopy = Boolean(invoice.isDuplicate || getInvoiceDuplicateFlag(invoice));
  const previewPageLabels = getDuplicateCopyPageLabels(isDuplicateCopy);
  const signatureImageSrc = invoice.signatureImage?.trim() ? invoice.signatureImage : "/STAMP.jpeg";

  return (
    <section className="invoice-preview-shell rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0">
      <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:min-h-[297mm] print:rounded-none print:border-0 print:shadow-none print:bg-white">
        {previewPageLabels.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className={`invoice-preview-page ${index > 0 ? "mt-6 border-t border-dashed border-slate-300 pt-6 print:mt-0 print:border-t-0 print:pt-0" : ""}`}
            style={index > 0 ? { breakBefore: "page", pageBreakBefore: "always" } : undefined}
          >
            {/* Header bar */}
            <div className="relative flex items-center border-b border-slate-300 bg-[#f7f9fc] px-4 py-1.5 print:px-4">
              <div className="flex-1" />
              <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold capitalize text-slate-900">
                {docLabel}
              </h2>
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </span>
            </div>

        {/* Company row */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-4 py-2 print:px-4">
          <div className="flex items-start gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold text-white">
              <img src="/favicon.png" alt="Company Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-wide text-slate-950 leading-tight">
                RADIATECH ELECTRA
              </h3>
              <p className="mt-0.5 text-[10px] text-slate-600 leading-tight">
                Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-600 leading-tight">
            <div>Phone: +91 81788 50959</div>
            <div>Email: sales@radiatech.in</div>
            <div>GSTIN: 09DDZPK0004H1ZF</div>
            <div>State: 09-Uttar Pradesh</div>
          </div>
        </div>

        {/* Bill To + Invoice Details */}
        <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
          <div className="border-b border-slate-300 bg-slate-50 p-2 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
            <div className="rounded-md border border-slate-300 bg-white p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Bill To:
              </p>
              <div className="mt-0.5 text-[11px] leading-4 text-slate-800">
                <div className="font-semibold text-slate-900">
                  {invoice.partyName || "—"}
                </div>
                {invoice.contactPerson ? (
                  <div>Attn: {invoice.contactPerson}</div>
                ) : null}
                <div>{invoice.address || "—"}</div>
                <div>
                  {[invoice.city, invoice.state, invoice.pincode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </div>
                <div>Contact No: {invoice.phone || "—"}</div>
                <div>Email: {invoice.email || "—"}</div>
                <div>GSTIN: {invoice.gstin || "—"}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-2">
            <div className="rounded-md border border-slate-300 bg-white p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Invoice Details:
              </p>
              <div className="mt-0.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px] leading-4 text-slate-800">
                <span className="font-semibold text-slate-900">Invoice No:</span>
                <span>{getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, false) || "—"}</span>
                <span className="font-semibold text-slate-900">Date:</span>
                <span>
                  {formatDate(invoice.invoiceDate || invoice.createdAt)}
                </span>
                <span className="font-semibold text-slate-900">PO Date:</span>
                <span>{formatDate(invoice.poDate || undefined)}</span>
                <span className="font-semibold text-slate-900">
                  E-way Bill No:
                </span>
                <span>{invoice.ewayBillNo || "—"}</span>
                <span className="font-semibold text-slate-900">PO No:</span>
                <span>{invoice.poNo || "—"}</span>
                <span className="font-semibold text-slate-900">
                  Reference No:
                </span>
                <span>{invoice.placeOfSupply || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ship To + Transportation Details */}
        <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2 print:grid-cols-2">
          <div className="border-b border-slate-300 bg-slate-50 p-2 sm:border-b-0 sm:border-r print:border-b-0 print:border-r">
            <div className="rounded-md border border-slate-300 bg-white p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Ship To:
              </p>
              <div className="mt-0.5 whitespace-pre-line text-[11px] leading-4 text-slate-800">
                {invoice.shipToAddress || "—"}
              </div>
            </div>
          </div>
          <div className="bg-white p-2">
            <div className="rounded-md border border-slate-300 bg-white p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Transportation Details:
              </p>
              <div className="mt-0.5 text-[11px] leading-4 text-slate-800">
                <div>Transport Name: {invoice.transportName || "—"}</div>
                <div>Vehicle Number: {invoice.vehicleNumber || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="invoice-table-wrap overflow-x-auto border-b border-slate-300">
          <table className="w-full table-fixed border-collapse text-[10px] print:text-[8.5px]">
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
              <tr className="bg-[#bec9d9] text-left text-slate-700">
                <th className="border border-slate-300 px-1 py-1 font-semibold">#</th>
                <th className="border border-slate-300 px-1 py-1 font-semibold">Item name</th>
                <th className="border border-slate-300 px-1 py-1 font-semibold">HSN/SAC</th>
                <th className="border border-slate-300 px-1 py-1 text-right font-semibold">Qty</th>
                <th className="border border-slate-300 px-1 py-1 font-semibold">Unit</th>
                <th className="border border-slate-300 px-1 py-1 text-right font-semibold">Price/unit</th>
                {shouldShowDiscountColumn && (
                  <th className="border border-slate-300 px-1 py-1 text-right font-semibold">Discount</th>
                )}
                <th className="border border-slate-300 px-1 py-1 text-right font-semibold">Taxable Price/unit</th>
                <th className="border border-slate-300 px-1 py-1 text-right font-semibold">Taxable amount</th>
                <th className="border border-slate-300 px-1 py-1 text-right font-semibold">GST</th>
                <th className="border border-slate-300 px-1 py-1 text-right font-semibold">Final Rate</th>
                <th className="border border-slate-300 px-1 py-1 text-right font-semibold">Amount Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="border border-slate-300 px-1 py-1 align-top">{index + 1}</td>
                  <td className="border border-slate-300 px-1 py-1 align-top break-words whitespace-normal">{item.description || "Item description"}</td>
                  <td className="border border-slate-300 px-1 py-1 align-top break-words whitespace-normal">{item.hsn || "—"}</td>
                  <td className="border border-slate-300 px-1 py-1 text-right align-top">{item.qty}</td>
                  <td className="border border-slate-300 px-1 py-1 align-top">{item.unit || "—"}</td>
                  <td className="border border-slate-300 px-1 py-1 text-right align-top">{formatCurrency(item.rate)}</td>
                  {shouldShowDiscountColumn && (
                    <td className="border border-slate-300 px-1 py-1 text-right align-top">
                      {renderCompactMetricCell(item.discountAmount, item.discountPercent)}
                    </td>
                  )}
                  <td className="border border-slate-300 px-1 py-1 text-right align-top">{formatCurrency(item.taxablePerUnit)}</td>
                  <td className="border border-slate-300 px-1 py-1 text-right align-top">{formatCurrency(item.taxableAmount)}</td>
                  <td className="border border-slate-300 px-1 py-1 text-right align-top">{renderCompactMetricCell(item.gstAmount, item.taxPercent)}</td>
                  <td className="border border-slate-300 px-1 py-1 text-right align-top">{formatCurrency(item.finalRatePerUnit)}</td>
                  <td className="border border-slate-300 px-1 py-1 text-right align-top font-semibold text-slate-900">{formatCurrency(item.rowAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-900">
                <td className="border border-slate-300 px-1 py-1" colSpan={3}>Total</td>
                <td className="border border-slate-300 px-1 py-1 text-right">{rows.reduce((sum, item) => sum + item.qty, 0)}</td>
                <td className="border border-slate-300 px-1 py-1" />
                <td className="border border-slate-300 px-1 py-1" />
                {shouldShowDiscountColumn && (
                  <td className="border border-slate-300 px-1 py-1 text-right">{formatCurrency(totals.discountTotal)}</td>
                )}
                <td className="border border-slate-300 px-1 py-1" />
                <td className="border border-slate-300 px-1 py-1 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1 py-1 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
                <td className="border border-slate-300 px-1 py-1" />
                <td className="border border-slate-300 px-1 py-1 text-right">
                  {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tax Summary + Totals */}
        <div className="grid grid-cols-1 border-b border-slate-300 bg-white md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
          <div className="min-w-0 border-b border-slate-300 bg-slate-50 p-2 md:border-b-0 md:border-r">
            <div className="invoice-card rounded-md border border-slate-300 bg-white p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tax Summary:</p>
              <label className="mt-1 mb-1 block">
                <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tax Option</span>
                <select
                  value={taxType}
                  onChange={(event) => handleTaxTypeChange(event.target.value as TaxType)}
                  disabled={!isInteractive}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 disabled:opacity-60"
                >
                  <option value="cgst-sgst">CGST + SGST</option>
                  <option value="igst">IGST</option>
                  <option value="none">No Tax</option>
                </select>
              </label>
              <div className="mt-1 overflow-x-auto">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-600">
                      <th className="border border-slate-300 px-1.5 py-0.5 font-semibold">Taxable</th>
                      {taxType === "cgst-sgst" ? (
                        <>
                          <th className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold">CGST (Rate)</th>
                          <th className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold">CGST (Amt)</th>
                          <th className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold">SGST (Rate)</th>
                          <th className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold">SGST (Amt)</th>
                        </>
                      ) : taxType === "igst" ? (
                        <>
                          <th className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold">IGST (Rate)</th>
                          <th className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold">IGST (Amt)</th>
                        </>
                      ) : null}
                      <th className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#fbfcfe]">
                      <td className="border border-slate-300 px-1.5 py-0.5 font-semibold text-slate-900">{formatCurrency(totals.taxable)}</td>
                      {taxType === "cgst-sgst" ? (
                        <>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{totals.cgstRate.toFixed(2)}%</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.cgst)}</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{totals.sgstRate.toFixed(2)}%</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.sgst)}</td>
                        </>
                      ) : taxType === "igst" ? (
                        <>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{totals.igstRate.toFixed(2)}%</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.igst)}</td>
                        </>
                      ) : null}
                      <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.tax)}</td>
                    </tr>
                    <tr className="bg-[#ce9b24] font-semibold text-slate-900">
                      <td className="border border-slate-300 px-1.5 py-0.5">TOTAL</td>
                      {taxType === "cgst-sgst" ? (
                        <>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">—</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.cgst)}</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">—</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.sgst)}</td>
                        </>
                      ) : taxType === "igst" ? (
                        <>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">—</td>
                          <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.igst)}</td>
                        </>
                      ) : null}
                      <td className="border border-slate-300 px-1.5 py-0.5 text-right">{formatCurrency(totals.tax)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-[11px] text-slate-700">
                <span className="font-semibold text-slate-900">Invoice Amount in Words: </span>
                {numberToIndianWords(totals.grandTotal)}
              </div>
            </div>
          </div>

          <div className="min-w-0 bg-white p-2 text-[11px] leading-tight text-slate-800">
            {totals.discountTotal > 0 && (
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <span className="min-w-0 pr-1">Item-wise Discount</span>
                <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.discountTotal)}</span>
              </div>
            )}
            {totals.extraDiscountAmount > 0 && (
              <div className="mt-0.5 flex items-start justify-between gap-2 text-amber-700">
                <span className="min-w-0 pr-1">Discount on Taxable Amount</span>
                <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.extraDiscountAmount)}</span>
              </div>
            )}
            {totals.extraDiscountAmount > 0 ? (
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <span className="min-w-0 pr-1">Taxable Amount (After Extra Discount)</span>
                <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxable)}</span>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 pr-1">Taxable Amount</span>
                <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.taxableBeforeExtraDiscount)}</span>
              </div>
            )}
            <div className="mt-0.5 flex items-start justify-between gap-2">
              <span className="min-w-0 pr-1">Tax</span>
              <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.tax)}</span>
            </div>
            {Math.abs(totals.roundOff) > 0 && (
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <span className="min-w-0 pr-1">Round Off</span>
                <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.roundOff)}</span>
              </div>
            )}
            <div className="mt-1 flex items-start justify-between gap-2 border-t border-slate-300 pt-1 text-[13px] font-semibold text-slate-950">
              <span className="min-w-0 pr-1">Grand Total</span>
              <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
            </div>
            <div className="mt-2 flex items-start justify-between gap-2">
              <span className="min-w-0 pr-1">Payment Mode</span>
              <span className="ml-auto shrink-0 text-right">: {invoice.paymentMode || "—"}</span>
            </div>
            <div className="mt-0.5 flex items-start justify-between gap-2 font-semibold text-slate-900">
              <span className="min-w-0 pr-1">Balance</span>
              <span className="ml-auto shrink-0 text-right">: {formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes + Terms */}
        {hasNotesOrTerms && (
          <div className="border-b border-slate-300 bg-slate-50 p-2 text-[11px] text-slate-700">
            <div className="rounded-md border border-slate-300 bg-white p-2">
              {invoice.notes?.trim() && (
                <>
                  <div className="font-semibold text-slate-900">Notes</div>
                  <div className="mt-0.5 mb-2 last:mb-0">{invoice.notes}</div>
                </>
              )}
              {invoice.terms?.trim() && (
                <>
                  <div className="font-semibold text-slate-900">Terms & Conditions</div>
                  <div className="mt-0.5">{invoice.terms}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bank Details + Signature */}
        <div className="grid grid-cols-1 gap-2 bg-white p-2 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <div className="invoice-card rounded-md border border-slate-300 bg-slate-50 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Bank Details:</p>
              <div className="mt-1 flex gap-2 items-start">
                <div className="flex-1 whitespace-pre-line text-[11px] text-slate-700">
                  {invoice.bankDetails || "—"}
                </div>
                <div className="flex-shrink-0">
                  <img src="/Bank QR.jpeg" alt="Bank QR Code" className="h-16 w-16 object-contain" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end justify-between text-[11px] text-slate-700">
            <div className="invoice-card rounded-md border border-slate-300 bg-white p-2">
              <div className="font-semibold text-slate-900">For Radiatech Electra:</div>
              <div className="mt-1 flex h-12 w-28 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
                {signatureImageSrc ? (
                  <img src={signatureImageSrc} alt="Authorized signature" className="h-full w-full object-contain" />
                ) : (
                  "Signature"
                )}
              </div>
              <div className="mt-0.5 text-center text-[10px] font-semibold text-slate-700">
                {invoice.authorizedSignature || "Authorized Signatory"}
              </div>
            </div>
          </div>
        </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 4mm;
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
            min-height: 289mm !important;
            box-shadow: none !important;
            border: 1.2px solid #cbd5e1 !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .invoice-preview-shell .invoice-card,
          .invoice-preview-shell .invoice-table-wrap {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .invoice-preview-page {
            page-break-before: auto;
            break-before: auto;
          }
          .invoice-preview-page + .invoice-preview-page {
            page-break-before: always !important;
            break-before: page !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}