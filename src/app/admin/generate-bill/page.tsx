"use client";

import AdminShell from "@/components/admin/AdminShell";
import Link from "next/link";
import { useEffect, useState } from "react";

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  invoiceDate?: string;
  createdAt?: string;
  dueDate?: string | null;
  gstin?: string;
  phone?: string;
  state?: string;
  address?: string;
  poDate?: string | null;
  ewayBillNo?: string;
  poNo?: string;
  placeOfSupply?: string;
  shipToAddress?: string;
  transportName?: string;
  vehicleNumber?: string;
  taxType?: string;
  paymentMode?: string;
  notes?: string;
  terms?: string;
  bankDetails?: string;
  authorizedSignature?: string;
  subtotal?: number;
  discountTotal?: number;
  taxableAmount?: number;
  taxAmount?: number;
  items?: Array<{
    description?: string;
    hsn?: string;
    unit?: string;
    qty?: number;
    rate?: number;
    taxPercent?: number;
    discountPercent?: number;
    taxableAmount?: number;
    gstAmount?: number;
    finalRatePerUnit?: number;
    rowAmount?: number;
  }>;
}

export default function GenerateBillPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      if (!response.ok) return;
      const data = await response.json();
      const nextInvoices = Array.isArray(data) ? data : [];
      setInvoices(nextInvoices);
      if (!selectedInvoice && nextInvoices.length > 0) {
        setSelectedInvoice(nextInvoices[0]);
      }
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm("Delete this invoice?")) return;

    try {
      const response = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}`, { method: "DELETE" });
      if (!response.ok) return;
      setInvoices((current) => current.filter((invoice) => invoice.id !== invoiceId));
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
      }
    } catch {
      // ignore
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
  };

  const formatCurrency = (value?: number) => `₹${(value ?? 0).toLocaleString("en-IN")}`;

  const getInvoiceTotals = (invoice: InvoiceSummary) => {
    const subtotal = invoice.items?.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0) ?? invoice.subtotal ?? 0;
    const discountTotal = invoice.items?.reduce((sum, item) => {
      const lineTotal = Number(item.qty || 0) * Number(item.rate || 0);
      return sum + (lineTotal * Number(item.discountPercent || 0)) / 100;
    }, 0) ?? invoice.discountTotal ?? 0;
    const taxable = invoice.items?.reduce((sum, item) => sum + Number(item.taxableAmount || 0), 0) ?? invoice.taxableAmount ?? subtotal - discountTotal;
    const tax = invoice.items?.reduce((sum, item) => sum + Number(item.gstAmount || 0), 0) ?? invoice.taxAmount ?? 0;
    const grandTotal = invoice.grandTotal ?? taxable + tax;

    return { subtotal, discountTotal, taxable, tax, grandTotal };
  };

  const handlePrintPreview = (invoice: InvoiceSummary) => {
    const totals = getInvoiceTotals(invoice);
    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      window.alert("Please allow pop-ups to open the print preview.");
      return;
    }

    const escapeHtml = (value?: string | number | null) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));

    const rows = (invoice.items || []).map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.description || "Item description")}</td>
        <td>${escapeHtml(item.hsn || "—")}</td>
        <td style="text-align:right">${escapeHtml(item.qty || 0)}</td>
        <td>${escapeHtml(item.unit || "—")}</td>
        <td style="text-align:right">${escapeHtml(formatCurrency(Number(item.rate || 0)))}</td>
        <td style="text-align:right">${escapeHtml(formatCurrency(Number(item.taxableAmount || 0)))}</td>
        <td style="text-align:right">${escapeHtml(formatCurrency(Number(item.gstAmount || 0)))}</td>
        <td style="text-align:right;font-weight:600">${escapeHtml(formatCurrency(Number(item.rowAmount || 0)))}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice Preview</title>
          <style>
            :root { color-scheme: light only; }
            body { margin: 0; padding: 24px; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
            .invoice-shell { max-width: 1000px; margin: 0 auto; background: white; border: 1px solid #cbd5e1; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
            .header-bar { display: flex; justify-content: space-between; align-items: center; background: #f7f9fc; border-bottom: 1px solid #e2e8f0; padding: 14px 24px; }
            .title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: #334155; }
            .subtle { font-size: 11px; color: #64748b; }
            .main { padding: 24px; }
            .company-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
            .company-name { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
            .company-address { font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.5; }
            .meta { text-align: right; font-size: 13px; color: #475569; line-height: 1.6; }
            .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: #64748b; margin-bottom: 8px; }
            .card-body { font-size: 13px; color: #334155; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
            th { background: #e2e8f0; text-align: left; font-weight: 700; color: #334155; }
            .totals { display: flex; justify-content: flex-end; margin-top: 16px; }
            .totals table { max-width: 320px; }
            .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
            .small { font-size: 12px; color: #475569; line-height: 1.5; }
            .signature-box { margin-top: 8px; border: 1px dashed #cbd5e1; border-radius: 6px; height: 70px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; }
            @media print { body { background: white; padding: 0; } .invoice-shell { box-shadow: none; border: none; } }
          </style>
        </head>
        <body>
          <div class="invoice-shell">
            <div class="header-bar">
              <div>
                <div class="title">Tax Invoice</div>
                <div class="subtle">Original for Recipient</div>
              </div>
              <div class="subtle">Generated from RadiaTech Fire Safety System</div>
            </div>
            <div class="main">
              <div class="company-row">
                <div>
                  <h1 class="company-name">RADIATECH ELECTRA</h1>
                  <div class="company-address">Basement, A-287, Sector 69, Noida, Uttar Pradesh, 201301</div>
                </div>
                <div class="meta">
                  <div><strong>Invoice No:</strong> ${escapeHtml(invoice.invoiceNumber)}</div>
                  <div><strong>Date:</strong> ${escapeHtml(formatDate(invoice.invoiceDate || invoice.createdAt))}</div>
                  <div><strong>Due Date:</strong> ${escapeHtml(formatDate(invoice.dueDate || undefined))}</div>
                </div>
              </div>
              <div class="section-grid">
                <div class="card">
                  <div class="card-title">Bill To</div>
                  <div class="card-body">
                    <div><strong>${escapeHtml(invoice.partyName)}</strong></div>
                    <div>${escapeHtml(invoice.address || "—")}</div>
                    <div>Contact No: ${escapeHtml(invoice.phone || "—")}</div>
                    <div>GSTIN: ${escapeHtml(invoice.gstin || "—")}</div>
                    <div>State: ${escapeHtml(invoice.state || "—")}</div>
                  </div>
                </div>
                <div class="card">
                  <div class="card-title">Invoice Details</div>
                  <div class="card-body">
                    <div>PO Date: ${escapeHtml(formatDate(invoice.poDate || undefined))}</div>
                    <div>E-way Bill No: ${escapeHtml(invoice.ewayBillNo || "—")}</div>
                    <div>PO No: ${escapeHtml(invoice.poNo || "—")}</div>
                    <div>Place of Supply: ${escapeHtml(invoice.placeOfSupply || "—")}</div>
                    <div>Payment Mode: ${escapeHtml(invoice.paymentMode || "—")}</div>
                  </div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item name</th>
                    <th>HSN/SAC</th>
                    <th style="text-align:right">Qty</th>
                    <th>Unit</th>
                    <th style="text-align:right">Price/unit</th>
                    <th style="text-align:right">Taxable Amount</th>
                    <th style="text-align:right">GST</th>
                    <th style="text-align:right">Amount Total</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="totals">
                <table>
                  <tr><td>Subtotal</td><td style="text-align:right">${escapeHtml(formatCurrency(totals.subtotal))}</td></tr>
                  <tr><td>Discount</td><td style="text-align:right">${escapeHtml(formatCurrency(totals.discountTotal))}</td></tr>
                  <tr><td>Taxable Amount</td><td style="text-align:right">${escapeHtml(formatCurrency(totals.taxable))}</td></tr>
                  <tr><td>Tax</td><td style="text-align:right">${escapeHtml(formatCurrency(totals.tax))}</td></tr>
                  <tr><th>Grand Total</th><th style="text-align:right">${escapeHtml(formatCurrency(totals.grandTotal))}</th></tr>
                </table>
              </div>
              <div class="footer">
                <div class="card">
                  <div class="card-title">Notes</div>
                  <div class="small">${escapeHtml(invoice.notes || "—")}</div>
                  <div class="card-title" style="margin-top:10px">Terms & Conditions</div>
                  <div class="small">${escapeHtml(invoice.terms || "—")}</div>
                </div>
                <div class="card">
                  <div class="card-title">Bank Details</div>
                  <div class="small">${escapeHtml(invoice.bankDetails || "—")}</div>
                  <div class="card-title" style="margin-top:12px">Authorized Signature</div>
                  <div class="signature-box">${escapeHtml(invoice.authorizedSignature || "Authorized Signatory")}</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
  };

  return (
    <AdminShell
      title="Generate Bill"
      description="Create quotation or invoice documents for your customers."
      action={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/admin/generate-bill/quotation"
            className="inline-flex items-center rounded-xl border border-amber-300 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            Quotation
          </Link>
          <Link
            href="/admin/generate-bill/invoice"
            className="inline-flex items-center rounded-xl border border-emerald-300 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Invoice
          </Link>
        </div>
      }
    >
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Choose a document type from the actions above to continue.
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Generated Invoices</h2>
            <p className="mt-1 text-sm text-slate-500">Saved invoices from the invoice generator appear here.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No invoices generated yet.
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1.2fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <div>Invoice</div>
                <div>Customer</div>
                <div>Date</div>
                <div>Amount</div>
                <div className="text-right">Actions</div>
              </div>
              {invoices.map((invoice) => (
                <div key={invoice.id} className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1.2fr] items-center border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <div>
                    <div className="font-semibold text-slate-900">{invoice.invoiceNumber}</div>
                    <div className="text-xs text-slate-500">#{invoice.id}</div>
                  </div>
                  <div>{invoice.partyName}</div>
                  <div>{formatDate(invoice.invoiceDate || invoice.createdAt)}</div>
                  <div>₹{invoice.grandTotal.toLocaleString("en-IN")}</div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(invoice)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </button>
                    <Link
                      href={`/admin/generate-bill/invoice?invoiceId=${invoice.id}`}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(invoice.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedInvoice && (() => {
              const totals = getInvoiceTotals(selectedInvoice);

              return (
                <div className="invoice-preview-shell mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div>
                      <div className="font-semibold text-slate-900">{selectedInvoice.invoiceNumber}</div>
                      <div>{selectedInvoice.partyName}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintPreview(selectedInvoice)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Print Preview
                      </button>
                      <Link
                        href={`/admin/generate-bill/invoice?invoiceId=${selectedInvoice.id}`}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Edit Invoice
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Tax Invoice</div>
                        <div className="mt-1 text-lg font-semibold text-slate-950">RADIATECH ELECTRA</div>
                        <div className="mt-1 text-sm text-slate-600">Basement, A-287, Sector 69, Noida, Uttar Pradesh, 201301</div>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <div>Invoice No: {selectedInvoice.invoiceNumber}</div>
                        <div>Date: {formatDate(selectedInvoice.invoiceDate || selectedInvoice.createdAt)}</div>
                        <div>Due Date: {formatDate(selectedInvoice.dueDate || undefined)}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Bill To</div>
                        <div className="mt-2 text-sm text-slate-700">
                          <div className="font-semibold text-slate-900">{selectedInvoice.partyName}</div>
                          <div>{selectedInvoice.address || "—"}</div>
                          <div>Contact: {selectedInvoice.phone || "—"}</div>
                          <div>GSTIN: {selectedInvoice.gstin || "—"}</div>
                          <div>State: {selectedInvoice.state || "—"}</div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice Details</div>
                        <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">PO Date:</span>
                          <span>{formatDate(selectedInvoice.poDate || undefined)}</span>
                          <span className="font-semibold text-slate-900">E-way Bill:</span>
                          <span>{selectedInvoice.ewayBillNo || "—"}</span>
                          <span className="font-semibold text-slate-900">PO No:</span>
                          <span>{selectedInvoice.poNo || "—"}</span>
                          <span className="font-semibold text-slate-900">Place of Supply:</span>
                          <span>{selectedInvoice.placeOfSupply || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-left text-slate-600">
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2">HSN</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2 text-right">Rate</th>
                            <th className="px-3 py-2 text-right">Taxable</th>
                            <th className="px-3 py-2 text-right">GST</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedInvoice.items || []).map((item, index) => (
                            <tr key={`${selectedInvoice.id}-${index}`} className="border-t border-slate-200">
                              <td className="px-3 py-2 text-slate-900">{item.description || "—"}</td>
                              <td className="px-3 py-2">{item.hsn || "—"}</td>
                              <td className="px-3 py-2 text-right">{item.qty || 0}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(item.rate || 0))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(item.taxableAmount || 0))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(item.gstAmount || 0))}</td>
                              <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(Number(item.rowAmount || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <div className="font-semibold text-slate-900">Notes</div>
                        <div className="mt-1">{selectedInvoice.notes || "—"}</div>
                        <div className="mt-3 font-semibold text-slate-900">Terms & Conditions</div>
                        <div className="mt-1">{selectedInvoice.terms || "—"}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <div className="flex items-center justify-between py-1"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                        <div className="flex items-center justify-between py-1"><span>Discount</span><span>{formatCurrency(totals.discountTotal)}</span></div>
                        <div className="flex items-center justify-between py-1"><span>Taxable</span><span>{formatCurrency(totals.taxable)}</span></div>
                        <div className="flex items-center justify-between py-1"><span>Tax</span><span>{formatCurrency(totals.tax)}</span></div>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-950"><span>Grand Total</span><span>{formatCurrency(totals.grandTotal)}</span></div>
                      </div>
                    </div>
                  </div>

                  <style jsx global>{`
                    @media print {
                      body {
                        background: white !important;
                      }
                      body > *:not(.invoice-preview-shell) {
                        display: none !important;
                      }
                      .invoice-preview-shell {
                        display: block !important;
                        border: none !important;
                        background: white !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                      }
                      .invoice-preview-shell .print\:hidden {
                        display: none !important;
                      }
                      .invoice-preview-shell .rounded-xl,
                      .invoice-preview-shell .rounded-lg {
                        border-radius: 0 !important;
                      }
                    }
                  `}</style>
                </div>
              );
            })()}
          </>
        )}
      </div>
      <div className="mt-6 hidden">
        <Link
          href="/admin/generate-bill/quotation"
          className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mb-4 inline-flex rounded-full bg-amber-200 p-3 text-amber-800">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 3h8l4 4v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
              <path d="M16 3v4h4" />
              <path d="M9 13h6" />
              <path d="M9 17h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-950">Quotation</h2>
          <p className="mt-2 text-sm text-slate-500">Create a quotation for customer approvals and pricing discussions.</p>
        </Link>

      </div>
    </AdminShell>
  );
}
