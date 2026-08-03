
"use client";

import type { InvoiceSummary } from "@/lib/invoiceRoute";
import { useMemo, useState } from "react";

type TaxType = "cgst-sgst" | "igst" | "none";

const formatCurrency = (value?: number) =>
  `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};

interface PMPreviewProps {
  invoice?: InvoiceSummary;
  taxType?: TaxType;
  onTaxTypeChange?: (type: TaxType) => void;
}

export default function PMPreview({ invoice, taxType: taxTypeProp, onTaxTypeChange }: PMPreviewProps) {
  const isInteractive = onTaxTypeChange !== undefined;
  const [internalTaxType, setInternalTaxType] = useState<TaxType>((invoice?.taxType as TaxType) || "cgst-sgst");
  const taxType = taxTypeProp ?? internalTaxType;

  const rows = useMemo(() => {
    const items = invoice?.items ?? [];
    return items.map((item, index) => {
      const rate = Number(item.rate || 0);
      const qty = Number(item.qty || 0);
      const taxPercent = Number(item.taxPercent || 0);
      const taxableAmount = qty * rate;
      const taxAmount = taxType === "none" ? 0 : taxableAmount * (taxPercent / 100);
      const rowAmount = taxableAmount + taxAmount;

      return {
        ...item,
        id: item.id ?? index,
        rate,
        qty,
        taxPercent,
        taxableAmount,
        taxAmount,
        rowAmount,
      };
    });
  }, [invoice?.items, taxType]);

  const totals = useMemo(() => {
    const subtotal = Number(invoice?.subtotal ?? rows.reduce((sum, row) => sum + row.taxableAmount, 0));
    const taxAmount = Number(invoice?.taxAmount ?? rows.reduce((sum, row) => sum + row.taxAmount, 0));
    const roundOff = Number(invoice?.roundOff ?? 0);
    const grandTotal = Number(invoice?.grandTotal ?? subtotal + taxAmount + roundOff);

    return {
      subtotal,
      taxAmount,
      roundOff,
      grandTotal,
    };
  }, [invoice?.grandTotal, invoice?.roundOff, invoice?.subtotal, invoice?.taxAmount, rows]);

  const effectivePartyName = invoice?.partyName ?? "—";
  const effectiveContactPerson = invoice?.contactPerson ?? "";
  const effectiveAddress = invoice?.address ?? "—";
  const effectiveCity = invoice?.city ?? "";
  const effectiveState = invoice?.state ?? "";
  const effectivePincode = invoice?.pincode ?? "";
  const effectivePhone = invoice?.phone ?? "—";
  const effectiveEmail = invoice?.email ?? "—";
  const effectiveGstin = invoice?.gstin ?? "—";
  const effectiveInvoiceNumber = invoice?.invoiceNumber ?? "—";
  const effectiveInvoiceDate = invoice?.invoiceDate ?? invoice?.createdAt ?? null;
  const effectiveNotes = invoice?.notes ?? "";
  const effectiveTerms = invoice?.terms ?? "";
  const effectiveAuthorizedSignature = invoice?.authorizedSignature || "Authorized Signatory";
  const defaultBankDetails = "Name: Punjab and Sind Bank, Plot No C1A, Sector 63, Noida\nAccount No: 15111180000370\nIFSC code: PSIB0021511\nAccount holder's name: Radiatech Electra";
  const effectiveBankDetails = (invoice?.bankDetails || "").trim() ? invoice?.bankDetails : defaultBankDetails;

  const handleTaxTypeChange = (value: TaxType) => {
    if (onTaxTypeChange) {
      onTaxTypeChange(value);
    } else {
      setInternalTaxType(value);
    }
  };

  const sectionHeaderClass = "bg-[#e7eef9] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#294c76] border-b border-slate-300";
  const hasNotes = !!effectiveNotes?.trim();
  const hasTerms = !!effectiveTerms?.trim();
  const signatureImageSrc = (invoice?.signatureImage || "").trim() ? invoice?.signatureImage : "/STAMP.jpeg";

  return (
    <section className="invoice-preview-shell border border-slate-200 bg-slate-50 p-4 shadow-sm print:border-[1.2px] print:border-slate-400 print:bg-white print:shadow-none print:p-0" style={{ color: "#000" }}>
      <div className="mx-auto w-full max-w-225 overflow-hidden border-[1.5px] border-slate-300 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:max-w-none print:w-[210mm] print:h-auto print:min-h-0 print:rounded-none print:border-0 print:shadow-none print:bg-white" style={{ color: "#000" }}>
        <div className="relative flex items-center justify-center border-b border-slate-300 bg-white px-5 py-2.5">
          <h2 className="text-[15px] font-bold text-black">Pending Material</h2>
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-5 py-3">
          <div className="flex items-start gap-3">
            <img src="/favicon.png" alt="Logo" className="h-20 w-20 object-contain" />
            <div>
              <h3 className="text-[20px] font-extrabold tracking-wide text-black">RADIATECH ELECTRA</h3>
              <p className="mt-0.5 text-[14px] text-black leading-snug">Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301</p>
            </div>
          </div>
          <div className="shrink-0 text-right text-[13px] leading-5">
            <div>Phone: +91 81788 50959</div>
            <div>Email: sales@radiatech.in</div>
            <div>GSTIN: 09DDZPK0004H1ZF</div>
            <div>State: 09-Uttar Pradesh</div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-slate-300">
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>To:</div>
            <div className="p-3 text-[13px] leading-5 text-black">
              <div className="font-semibold text-black">{effectivePartyName}</div>
              {effectiveContactPerson && <div>{effectiveContactPerson}</div>}
              <div>{effectiveAddress}</div>
              <div>{[effectiveCity, effectiveState, effectivePincode].filter(Boolean).join(", ") || "—"}</div>
              <div>Contact No: {effectivePhone}</div>
              <div>Email: {effectiveEmail}</div>
              <div>GSTIN: {effectiveGstin}</div>
            </div>
          </div>
          <div>
            <div className={sectionHeaderClass}>Details:</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 p-3 text-[13px] text-black">
              <span className="font-semibold text-black">Document No:</span><span>{effectiveInvoiceNumber}</span>
              <span className="font-semibold text-black">Date:</span><span>{formatDate(effectiveInvoiceDate)}</span>
              <span className="font-semibold text-black">Prepared By:</span><span>{effectiveAuthorizedSignature}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border-b border-slate-300">
          <table className="w-full table-fixed border-collapse text-[11px]">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[28%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#bec9d9] text-slate-700">
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">#</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Item name</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Qty</th>
                <th className="border border-slate-300 px-1.5 py-2 text-left font-semibold">Unit</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Rate</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Taxable</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Tax</th>
                <th className="border border-slate-300 px-1.5 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.id || index} className="odd:bg-white even:bg-slate-50/50">
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{index + 1}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.description || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{item.qty}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 align-top">{item.unit || "—"}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.rate)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxableAmount)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top">{formatCurrency(item.taxAmount)}</td>
                  <td className="border border-slate-300 px-1.5 py-1.5 text-right align-top font-semibold text-black">{formatCurrency(item.rowAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid border-b border-slate-300" style={{ gridTemplateColumns: "1.15fr 0.85fr" }}>
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Tax Summary</div>
            <div className="p-2.5">
              <div className="mb-1.5 print:hidden">
                <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-black">Tax Option</span>
                <select
                  value={taxType}
                  onChange={(event) => handleTaxTypeChange(event.target.value as TaxType)}
                  disabled={!isInteractive}
                  className="w-40 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] text-black disabled:opacity-60"
                >
                  <option value="cgst-sgst">CGST + SGST</option>
                  <option value="igst">IGST</option>
                  <option value="none">No Tax</option>
                </select>
              </div>
              <div className="space-y-1 text-[10px] text-black">
                {taxType === "cgst-sgst" ? (
                  <>
                    <div className="flex justify-between gap-2 pl-2 text-black">
                      <span>CGST (9%)</span>
                      <span>{formatCurrency(totals.taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between gap-2 pl-2 text-black">
                      <span>SGST (9%)</span>
                      <span>{formatCurrency(totals.taxAmount / 2)}</span>
                    </div>
                  </>
                ) : taxType === "igst" ? (
                  <div className="flex justify-between gap-2 pl-2 text-black">
                    <span>IGST (18%)</span>
                    <span>{formatCurrency(totals.taxAmount)}</span>
                  </div>
                ) : null}
                <div className="mt-2 border-t border-slate-300 pt-1.5 text-[10px] text-black">
                  <div className="font-medium">Amount in Words</div>
                  <div className="mt-0.5">{`Rupees ${Math.round(totals.grandTotal).toLocaleString("en-IN")} only`}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-2.5 text-[11px] text-black">
            <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-black">Amount Summary</div>
            <div className="space-y-1">
              <div className="flex justify-between gap-2">
                <span>Subtotal</span>
                <span className="text-right">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Tax</span>
                <span className="text-right">{formatCurrency(totals.taxAmount)}</span>
              </div>
              {Math.abs(totals.roundOff) > 0 && (
                <div className="flex justify-between gap-2">
                  <span>Round Off</span>
                  <span className="text-right">{formatCurrency(totals.roundOff)}</span>
                </div>
              )}
              <div className="mt-1.5 border-t border-slate-300 pt-1.5">
                <div className="flex justify-between gap-2 text-[12px] font-semibold text-black">
                  <span>Grand Total</span>
                  <span className="text-right">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
              <div className="mt-2 border-t border-slate-300 pt-1.5">
               
                <div className="mt-1 flex justify-between gap-2">
                  <span>Payment Mode</span>
                  <span className="text-right">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(hasNotes || hasTerms) && (
          <div className="grid grid-cols-1 border-b border-slate-300 print:grid-cols-2 md:grid-cols-2">
            {hasNotes && (
              <div className={`border-b border-slate-300 ${hasTerms ? "md:border-r print:border-r" : ""}`}>
                <div className={sectionHeaderClass}>Notes</div>
                <div className="px-4 py-2.5 text-[12px] leading-5 text-black whitespace-pre-line">{effectiveNotes}</div>
              </div>
            )}
            {hasTerms && (
              <div className="border-b border-slate-300">
                <div className={sectionHeaderClass}>Terms &amp; Conditions</div>
                <div className="px-4 py-2.5 text-[12px] leading-5 text-black whitespace-pre-line">{effectiveTerms}</div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2">
          <div className="border-r border-slate-300">
            <div className={sectionHeaderClass}>Bank Details</div>
            <div className="flex items-start gap-3 p-3">
              <div className="min-w-0 whitespace-pre-line text-[12px] text-slate-700 leading-5">{effectiveBankDetails}</div>
              <img src="/Bank QR.jpeg" alt="Bank QR Code" className="h-16 w-16 shrink-0 object-contain" />
            </div>
          </div>
          <div>
            <div className={`${sectionHeaderClass} text-right`}>For Radiatech Electra</div>
            <div className="p-3 flex flex-col items-end">
              <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                {signatureImageSrc ? (
                  <img src={signatureImageSrc} alt="Signature" className="h-full w-full object-contain" />
                ) : "Signature"}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-700">{effectiveAuthorizedSignature}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
