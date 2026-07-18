// "use client";

// import AdminShell from "@/components/admin/AdminShell";
// import { useEffect, useMemo, useState } from "react";

// type PaymentRecord = {
//   id: string;
//   amount: number;
//   paymentMode: string;
//   note: string;
//   paidAt: string;
// };

// type InvoiceRow = {
//   id: string;
//   invoiceNumber: string;
//   partyName: string;
//   email: string;
//   grandTotal: number;
//   dueDate: string | null;
//   paymentMode: string;
//   notes: string;
//   totalPaid: number;
//   remaining: number;
//   payments: PaymentRecord[];
// };

// export default function PaymentInPage() {
//   const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
//   const [amount, setAmount] = useState(0);
//   const [paymentMode, setPaymentMode] = useState("Cash");
//   const [note, setNote] = useState("");

//   useEffect(() => {
//     let canceled = false;

//     async function load() {
//       setLoading(true);
//       try {
//         const res = await fetch("/api/admin/payment-invoices");
//         const data = await res.json();
//         if (!res.ok) throw new Error(data?.error || "Unable to load invoices");
//         if (!canceled) setInvoices(data.invoices || []);
//       } catch (err: any) {
//         if (!canceled) setError(err.message || String(err));
//       } finally {
//         if (!canceled) setLoading(false);
//       }
//     }

//     void load();
//     return () => {
//       canceled = true;
//     };
//   }, []);

//   const selectedInvoice = useMemo(
//     () => invoices.find((invoice) => invoice.id === selectedInvoiceId),
//     [invoices, selectedInvoiceId],
//   );

//   const submitPayment = async () => {
//     if (!selectedInvoiceId || amount <= 0) {
//       alert("Select invoice and enter a valid amount.");
//       return;
//     }

//     try {
//       const res = await fetch("/api/admin/payment-invoices/record-payment", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ invoiceId: selectedInvoiceId, amount, paymentMode, note }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.error || "Payment failed");
//       alert("Payment recorded successfully.");
//       setAmount(0);
//       setNote("");
//       const refreshed = await (await fetch("/api/admin/payment-invoices")).json();
//       setInvoices(refreshed.invoices || []);
//     } catch (err: any) {
//       alert(err.message || String(err));
//     }
//   };

//   return (
//     <AdminShell title="Payment IN" description="Record received payments, track partial receipts, and see remaining invoice balances.">
//       <div className="space-y-6">
//         {loading ? (
//           <div className="h-24 animate-pulse rounded-lg bg-white p-6" />
//         ) : error ? (
//           <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
//         ) : (
//           <>
//             <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
//               <section className="rounded-xl border border-slate-200 bg-white p-6">
//                 <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
//                 <div className="mt-4 space-y-3">
//                   {invoices.map((invoice) => (
//                     <button
//                       key={invoice.id}
//                       onClick={() => setSelectedInvoiceId(invoice.id)}
//                       className={`w-full rounded-lg border p-4 text-left transition ${
//                         invoice.id === selectedInvoiceId
//                           ? "border-primary bg-primary/5"
//                           : "border-slate-200 bg-white hover:border-slate-300"
//                       }`}
//                     >
//                       <div className="flex items-center justify-between gap-4">
//                         <div>
//                           <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
//                           <p className="text-sm text-slate-500">{invoice.partyName}</p>
//                         </div>
//                         <div className="text-right text-sm text-slate-500">
//                           <p>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</p>
//                           <p>{invoice.paymentMode || "-"}</p>
//                         </div>
//                       </div>
//                       <div className="mt-3 flex flex-wrap gap-2 text-sm">
//                         <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">Total ₹{invoice.grandTotal.toFixed(2)}</span>
//                         <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Paid ₹{invoice.totalPaid.toFixed(2)}</span>
//                         <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Remaining ₹{invoice.remaining.toFixed(2)}</span>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </section>

//               <section className="rounded-xl border border-slate-200 bg-white p-6">
//                 <h2 className="text-lg font-semibold text-slate-900">Record Payment</h2>
//                 {selectedInvoice ? (
//                   <div className="mt-4 space-y-4">
//                     <div>
//                       <p className="text-sm text-slate-500">Invoice</p>
//                       <p className="font-semibold text-slate-900">{selectedInvoice.invoiceNumber}</p>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-slate-700">Amount</label>
//                       <input
//                         type="number"
//                         value={amount === 0 ? "" : amount}
//                         onChange={(event) => setAmount(Number(event.target.value))}
//                         className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//                         placeholder="0.00"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-slate-700">Payment Mode</label>
//                       <input
//                         type="text"
//                         value={paymentMode}
//                         onChange={(event) => setPaymentMode(event.target.value)}
//                         className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//                         placeholder="Cash"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-slate-700">Note</label>
//                       <textarea
//                         value={note}
//                         onChange={(event) => setNote(event.target.value)}
//                         className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
//                         rows={3}
//                         placeholder="Payment details or receipt number"
//                       />
//                     </div>
//                     <button
//                       type="button"
//                       onClick={submitPayment}
//                       className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
//                     >
//                       Record Payment
//                     </button>
//                     <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
//                       <p>
//                         <span className="font-medium">Remaining:</span> ₹{selectedInvoice.remaining.toFixed(2)}
//                       </p>
//                       <p className="mt-1">
//                         <span className="font-medium">Notes:</span> {selectedInvoice.notes || "No notes"}
//                       </p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
//                     Select an invoice on the left to record a payment.
//                   </div>
//                 )}
//               </section>
//             </div>

//             {selectedInvoice && (
//               <section className="rounded-xl border border-slate-200 bg-white p-6">
//                 <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
//                 <div className="mt-4 space-y-3">
//                   {selectedInvoice.payments.length === 0 ? (
//                     <p className="text-sm text-slate-500">No payments recorded yet.</p>
//                   ) : (
//                     selectedInvoice.payments.map((payment) => (
//                       <div key={payment.id} className="rounded-lg border border-slate-200 p-4">
//                         <div className="flex items-center justify-between gap-4">
//                           <p className="font-semibold text-slate-900">₹{payment.amount.toFixed(2)}</p>
//                           <span className="text-sm text-slate-500">{new Date(payment.paidAt).toLocaleDateString()}</span>
//                         </div>
//                         <p className="mt-1 text-sm text-slate-500">Mode: {payment.paymentMode}</p>
//                         {payment.note && <p className="mt-1 text-sm text-slate-500">Note: {payment.note}</p>}
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </section>
//             )}
//           </>
//         )}
//       </div>
//     </AdminShell>
//   );
// }



"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useEffect, useMemo, useState } from "react";

type PaymentRecord = {
  id: string;
  amount: number;
  paymentMode: string;
  note: string;
  paidAt: string;
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  email: string;
  grandTotal: number;
  dueDate: string | null;
  paymentMode: string;
  notes: string;
  totalPaid: number;
  remaining: number;
  payments: PaymentRecord[];
};

export default function PaymentInPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [historyInvoice, setHistoryInvoice] = useState<InvoiceRow | null>(null);
  const [updateInvoice, setUpdateInvoice] = useState<InvoiceRow | null>(null);

  // Form submission states
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-invoices");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to load invoices");
      setInvoices(data.invoices || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      if (cancelled) return;
      await fetchInvoices();
      if (cancelled) return;
    };

    void loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((invoice) => {
      const haystack = [invoice.invoiceNumber, invoice.partyName, invoice.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [invoices, searchTerm]);

  // Handle open modals and clear previous form values
  const openUpdateModal = (invoice: InvoiceRow) => {
    setUpdateInvoice(invoice);
    setAmount(invoice.remaining); // Autofill remaining balance for convenience
    setPaymentMode("Cash");
    setNote("");
  };

  const submitPayment = async () => {
    if (!updateInvoice || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payment-invoices/record-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: updateInvoice.id, amount, paymentMode, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Payment failed");
      
      alert("Payment recorded successfully.");
      setUpdateInvoice(null);
      await fetchInvoices();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Payment IN" description="Manage incoming client payments, view active receipts, and update due balances.">
      <div className="space-y-6">
        
        {/* Top Control Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative max-w-md w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, or email..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Showing {filteredInvoices.length} of {invoices.length} entries
          </div>
        </div>

        {/* Loading & Error States */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : (
          /* Main Table Grid Layout */
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-4">ID & Date</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Remaining</th>
                  <th className="px-6 py-4 text-center">Mode</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID & Date */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-semibold text-slate-900">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-slate-400">
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { dateStyle: "medium" }) : "-"}
                        </div>
                      </td>
                      {/* Customer Name */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{invoice.partyName}</div>
                        <div className="text-xs text-slate-400">{invoice.email}</div>
                      </td>
                      {/* Total */}
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-slate-900">
                        ₹{invoice.grandTotal.toFixed(2)}
                      </td>
                      {/* Paid */}
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-emerald-600">
                        ₹{invoice.totalPaid.toFixed(2)}
                      </td>
                      {/* Remaining */}
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium">
                        <span className={`px-2 py-1 rounded-md text-xs ${invoice.remaining > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          ₹{invoice.remaining.toFixed(2)}
                        </span>
                      </td>
                      {/* Mode */}
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {invoice.paymentMode || "N/A"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <div className="inline-flex rounded-lg shadow-sm gap-2">
                          <button
                            type="button"
                            onClick={() => openUpdateModal(invoice)}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                          >
                            Update Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryInvoice(invoice)}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          >
                            Payment History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* POPUP MODAL: UPDATE PAYMENT */}
        {updateInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">Record Received Payment</h3>
                <button 
                  onClick={() => setUpdateInvoice(null)} 
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
                  <div>
                    <span className="font-bold text-slate-700">Invoice:</span> {updateInvoice.invoiceNumber}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Pending:</span> ₹{updateInvoice.remaining.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">Amount Received</label>
                  <input
                    type="number"
                    value={amount === 0 ? "" : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">Notes / Reference</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    rows={2}
                    placeholder="e.g. Transaction ID, Check number..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setUpdateInvoice(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitPayment}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POPUP MODAL: PAYMENT HISTORY */}
        {historyInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
                  <p className="text-xs text-slate-400">Records for {historyInvoice.invoiceNumber} — {historyInvoice.partyName}</p>
                </div>
                <button 
                  onClick={() => setHistoryInvoice(null)} 
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
                {historyInvoice.payments.length === 0 ? (
                  <p className="text-center py-6 text-sm text-slate-400">No incoming transactions found for this invoice.</p>
                ) : (
                  historyInvoice.payments.map((payment) => (
                    <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm">
                      <div>
                        <div className="font-bold text-slate-900">₹{payment.amount.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">Mode: {payment.paymentMode}</div>
                        {payment.note && <div className="mt-0.5 text-xs italic text-slate-400">&quot;{payment.note}&quot;</div>}
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="inline-flex rounded-full bg-blue-50 text-blue-700 font-medium px-2 py-0.5 text-xs">
                          {new Date(payment.paidAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setHistoryInvoice(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}