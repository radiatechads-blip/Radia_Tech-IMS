// "use client";

// import AdminShell from "@/components/admin/AdminShell";
// import { companyInfo } from "@/data/company";
// import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
// import {
//   ChevronDown,
//   Plus,
//   Printer,
//   Trash2
// } from "lucide-react";
// import { useEffect, useMemo, useState } from "react";

// // ────────────────────────────────────────────────────────────────────────
// // Interfaces & Types
// // ────────────────────────────────────────────────────────────────────────

// interface ProductOption {
//   id: string;
//   name: string;
//   unit: string;
//   price?: number | null;
// }

// interface ProductApiResponse {
//   id: string;
//   name: string;
//   unit?: string;
//   price?: number | null;
//   pricePerMeter?: string;
// }

// interface CustomerOption {
//   id: string;
//   name: string;
//   contactPerson?: string;
//   phone?: string;
//   email?: string;
//   gstin?: string;
//   address?: string;
//   city?: string;
//   state?: string;
//   pincode?: string;
// }

// interface InvoiceSummary {
//   id: string;
//   invoiceNumber?: string;
//   invoiceDate?: string;
//   grandTotal?: number;
//   paymentMode?: string;
//   partyName?: string;
// }

// interface StatementItem {
//   id: number;
//   date: string;
//   tnxType: string;
//   refNo: string;
//   paymentStatus: "Paid" | "Unpaid";
//   total: number;
//   receivedPaid: number;
//   tnxBalance: number;
//   receivableBalance: number;
//   payableBalance: number;
// }

// const today = new Date().toISOString().slice(0, 10);

// export default function PendingMaterialBillsPage() {
//   const [products, setProducts] = useState<ProductOption[]>([]);
//   const [selectedProductId, setSelectedProductId] = useState("");
//   const [items, setItems] = useState<StatementItem[]>([]);
//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingCustomers, setLoadingCustomers] = useState(true);
//   const [loadingInvoices, setLoadingInvoices] = useState(false);
//   const [customers, setCustomers] = useState<CustomerOption[]>([]);
//   const [selectedCustomerId, setSelectedCustomerId] = useState("");
  
//   // Customer and Duration States
//   const [customerName, setCustomerName] = useState("");
//   const [customerCompany, setCustomerCompany] = useState("");
//   const [customerGst, setCustomerGst] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [customerEmail, setCustomerEmail] = useState("");
//   const [customerAddress, setCustomerAddress] = useState("");
//   const [billingDate, setBillingDate] = useState(today);
//   const [durationFrom, setDurationFrom] = useState(today);
//   const [durationTo, setDurationTo] = useState(today);
  
//   const [preparedBy, setPreparedBy] = useState(companyInfo?.ceo || "Authorized Signatory");
//   const [subject, setSubject] = useState("");
//   const [showPreview, setShowPreview] = useState(false);
//   const [printMode, setPrintMode] = useState(false);

//   // ────────────────────────────────────────────────────────────────────────
//   // Side Effects & Data Fetching
//   // ────────────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     let ignore = false;

//     const loadCustomers = async () => {
//       try {
//         const response = await fetch("/api/customers");
//         if (!response.ok) throw new Error("Unable to load customers");

//         const data = await response.json();
//         const customerList = Array.isArray(data) ? data : data?.items ?? [];

//         if (!ignore) {
//           const normalizedCustomers = customerList.map((customer: CustomerOption) => ({
//             id: customer.id,
//             name: customer.name,
//             contactPerson: customer.contactPerson ?? "",
//             phone: customer.phone ?? "",
//             email: customer.email ?? "",
//             gstin: customer.gstin ?? "",
//             address: customer.address ?? "",
//             city: customer.city ?? "",
//             state: customer.state ?? "",
//             pincode: customer.pincode ?? "",
//           }));

//           setCustomers(normalizedCustomers);
//         }
//       } catch {
//         if (!ignore) setCustomers([]);
//       } finally {
//         if (!ignore) setLoadingCustomers(false);
//       }
//     };

//     const loadProducts = async () => {
//       try {
//         const response = await fetch("/api/products?admin=true");
//         if (!response.ok) throw new Error("Unable to load products");

//         const data = await response.json();
//         const productList = Array.isArray(data) ? data : data?.items ?? [];

//         if (!ignore) {
//           const normalizedProducts = productList.map((product: ProductApiResponse) => ({
//             id: product.id,
//             name: product.name,
//             unit: product.unit ?? "",
//             price: typeof (product as any).price === "number" ? (product as any).price : Number.parseFloat(product.pricePerMeter || "0") || 0,
//           }));

//           setProducts(normalizedProducts);
//           setSelectedProductId((current) => current || normalizedProducts[0]?.id || "");
//         }
//       } catch {
//         if (!ignore) setProducts([]);
//       } finally {
//         if (!ignore) setLoadingProducts(false);
//       }
//     };

//     void loadCustomers();
//     void loadProducts();

//     return () => {
//       ignore = true;
//     };
//   }, []);

//   // ────────────────────────────────────────────────────────────────────────
//   // Logic Handlers
//   // ────────────────────────────────────────────────────────────────────────

//   const populateCustomerDetails = (customer: CustomerOption | null) => {
//     setCustomerName(customer?.name ?? "");
//     setCustomerCompany(customer?.contactPerson ?? "");
//     setCustomerGst(customer?.gstin ?? "");
//     setCustomerPhone(customer?.phone ?? "");
//     setCustomerEmail(customer?.email ?? "");

//     const addressParts = [customer?.address, customer?.city, customer?.state, customer?.pincode]
//       .filter(Boolean)
//       .join(", ");

//     setCustomerAddress(addressParts);
//   };

//   const loadCustomerInvoices = async (customer: CustomerOption) => {
//     setLoadingInvoices(true);
//     setItems([]);

//     try {
//       const response = await fetch("/api/admin/payment-invoices");
//       if (!response.ok) throw new Error("Unable to load payment-in invoices");

//       const data = await response.json();
//       const invoiceList = Array.isArray(data?.invoices) ? data.invoices : [];

//       const customerInvoices = invoiceList
//         .filter((invoice: any) => {
//           const partyNameStr = String(invoice.partyName || "").trim().toLowerCase();
//           const customerNameStr = String(customer.name || "").trim().toLowerCase();
//           return partyNameStr && (partyNameStr === customerNameStr || partyNameStr.includes(customerNameStr) || customerNameStr.includes(partyNameStr));
//         })
//         .sort((a: any, b: any) => {
//           const left = new Date(a.invoiceDate || 0).getTime();
//           const right = new Date(b.invoiceDate || 0).getTime();
//           return right - left;
//         })
//         .map((invoice: any) => {
//           const total = Number(invoice.grandTotal || 0);
//           const paid = Number(invoice.totalPaid || 0);
//           const remaining = Number(invoice.remaining ?? Math.max(total - paid, 0));

//           return {
//             id: Number(String(invoice.id).replace(/[^0-9]/g, "")) || Date.now() + Math.random(),
//             date: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().slice(0, 10) : today,
//             tnxType: invoice.paymentMode ? `Invoice (${invoice.paymentMode})` : "Invoice",
//             refNo: getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, false) || "—",
//             paymentStatus: remaining > 0 ? ("Unpaid" as const) : ("Paid" as const),
//             total,
//             receivedPaid: paid,
//             tnxBalance: Number((total - paid).toFixed(2)),
//             receivableBalance: remaining,
//             payableBalance: 0,
//           };
//         });

//       setItems(customerInvoices);
//     } catch {
//       setItems([]);
//     } finally {
//       setLoadingInvoices(false);
//     }
//   };

//   const handleCustomerSelection = async (customerId: string) => {
//     setSelectedCustomerId(customerId);

//     if (!customerId) {
//       populateCustomerDetails(null);
//       setItems([]);
//       return;
//     }

//     const customer = customers.find((entry) => entry.id === customerId) || null;
//     populateCustomerDetails(customer);

//     if (customer) {
//       await loadCustomerInvoices(customer);
//     } else {
//       setItems([]);
//     }
//   };

//   // ────────────────────────────────────────────────────────────────────────
//   // Calculations & Row Mutations
//   // ────────────────────────────────────────────────────────────────────────

//   const totals = useMemo(() => {
//     return items.reduce(
//       (acc, item) => {
//         acc.total += item.total;
//         acc.receivedPaid += item.receivedPaid;
//         acc.tnxBalance += item.tnxBalance;
//         acc.receivableBalance += item.receivableBalance;
//         acc.payableBalance += item.payableBalance;
//         return acc;
//       },
//       { total: 0, receivedPaid: 0, tnxBalance: 0, receivableBalance: 0, payableBalance: 0 }
//     );
//   }, [items]);
  
//   const getNumericInputValue = (value: number) => (value === 0 ? "" : value);

//   const addNewTransactionRow = () => {
//     setItems((current) => [
//       ...current,
//       {
//         id: Date.now(),
//         date: today,
//         tnxType: "Sales",
//         refNo: `REF-${Date.now().toString().slice(-4)}`,
//         paymentStatus: "Unpaid",
//         total: 0,
//         receivedPaid: 0,
//         tnxBalance: 0,
//         receivableBalance: 0,
//         payableBalance: 0,
//       },
//     ]);
//   };

//   const updateItem = (id: number, key: keyof StatementItem, value: string | number) => {
//     setItems((current) =>
//       current.map((item) => {
//         if (item.id !== id) return item;

//         const updatedItem = { ...item, [key]: value } as StatementItem;

//         if (["total", "receivedPaid", "receivableBalance", "payableBalance"].includes(key)) {
//           const num = Number(value);
//           updatedItem[key as "total" | "receivedPaid" | "receivableBalance" | "payableBalance"] = Number.isFinite(num) ? num : 0;
//         }

//         if (key === "total" || key === "receivedPaid") {
//           updatedItem.tnxBalance = updatedItem.total - updatedItem.receivedPaid;
//         }

//         return updatedItem;
//       })
//     );
//   };

//   const removeItem = (id: number) => {
//     setItems((current) => current.filter((item) => item.id !== id));
//   };

//   const handlePrint = () => {
//     setShowPreview(true);
//     setPrintMode(true);
//     window.setTimeout(() => {
//       window.print();
//       setPrintMode(false);
//     }, 400);
//   };

//   // ────────────────────────────────────────────────────────────────────────
//   // Styles (Matching File 2 Visual Language)
//   // ────────────────────────────────────────────────────────────────────────

//   const inputCls =
//     "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 placeholder-gray-400";

//   const selectCls =
//     "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";

//   const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

//   return (
//     <AdminShell
//       title="Party Statement & Bills"
//       description="Update ledger sheets, track payments, monitor balances and print clear client transaction sheets."
//     >
//       <div className="min-h-screen bg-[#e8eaf0] font-sans text-[13px]">
//         {/* ══════════════════════════════════════════════════════════════
//             DATA-ENTRY SCREEN — Visual language from File 2
//            ══════════════════════════════════════════════════════════════ */}
//         <div className={`${showPreview ? "hidden" : ""} ${printMode ? "hidden" : ""}`}>
//           {/* Action Toolbar */}
//           <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
//             <div className="flex items-center gap-3">
//               <span className="text-base font-semibold text-gray-800">
//                 Statement Customization
//               </span>
//               {loadingInvoices && (
//                 <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
//                   Loading invoices...
//                 </span>
//               )}
//             </div>

//             <div className="flex flex-wrap items-center gap-2">
//               <button
//                 type="button"
//                 onClick={addNewTransactionRow}
//                 className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-700"
//               >
//                 <Plus size={14} /> Add Row Entry
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setShowPreview(true)}
//                 className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
//               >
//                 Preview Sheet
//               </button>

//               <button
//                 type="button"
//                 onClick={handlePrint}
//                 className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700"
//               >
//                 <Printer size={14} /> Print Statement
//               </button>
//             </div>
//           </div>

//           <div className="mx-auto max-w-[1400px] p-3 space-y-3">
//             {/* Customer & Statement Period Layout */}
//             <div className="rounded bg-white border border-gray-200 shadow-sm p-4">
//               <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                
//                 {/* Saved Customer Dropdown Selection */}
//                 <div className="space-y-2">
//                   <div>
//                     <label className={`${labelCls} text-blue-600`}>
//                       Select Saved Customer
//                     </label>
//                     <div className="relative">
//                       <select
//                         value={selectedCustomerId}
//                         onChange={(event) => void handleCustomerSelection(event.target.value)}
//                         className={`${selectCls} border-blue-400 ring-1 ring-blue-200 pr-7`}
//                         disabled={loadingCustomers}
//                       >
//                         <option value="">Choose customer from saved records</option>
//                         {customers.map((customer) => (
//                           <option key={customer.id} value={customer.id}>
//                             {customer.name} {customer.phone ? `• ${customer.phone}` : ""}
//                           </option>
//                         ))}
//                       </select>
//                       <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
//                     </div>
//                     {loadingCustomers && <p className="mt-1 text-[11px] text-gray-400">Loading customer database...</p>}
//                   </div>

//                   <div>
//                     <label className={labelCls}>Customer Name / Company</label>
//                     <input
//                       type="text"
//                       value={customerName}
//                       onChange={(e) => setCustomerName(e.target.value)}
//                       placeholder="Enter customer name"
//                       className={inputCls}
//                     />
//                   </div>
//                 </div>

//                 {/* Additional Customer Fields */}
//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className={labelCls}>Contact Person</label>
//                       <input
//                         type="text"
//                         value={customerCompany}
//                         onChange={(e) => setCustomerCompany(e.target.value)}
//                         placeholder="Contact representative"
//                         className={inputCls}
//                       />
//                     </div>
//                     <div>
//                       <label className={labelCls}>GSTIN</label>
//                       <input
//                         type="text"
//                         value={customerGst}
//                         onChange={(e) => setCustomerGst(e.target.value)}
//                         placeholder="GST identification"
//                         className={inputCls}
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className={labelCls}>Billing Address Details</label>
//                     <input
//                       type="text"
//                       value={customerAddress}
//                       onChange={(e) => setCustomerAddress(e.target.value)}
//                       placeholder="Complete location address"
//                       className={inputCls}
//                     />
//                   </div>
//                 </div>

//                 {/* Date Ranges and Timeline Customizer */}
//                 <div className="space-y-2 bg-[#f8fafc] border border-slate-100 rounded-lg p-3">
//                   <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Statement Timeline</span>
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className={labelCls}>From Date</label>
//                       <div className="relative">
//                         <input
//                           type="date"
//                           value={durationFrom}
//                           onChange={(e) => setDurationFrom(e.target.value)}
//                           className={inputCls}
//                         />
//                       </div>
//                     </div>
//                     <div>
//                       <label className={labelCls}>To Date</label>
//                       <div className="relative">
//                         <input
//                           type="date"
//                           value={durationTo}
//                           onChange={(e) => setDurationTo(e.target.value)}
//                           className={inputCls}
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-2 mt-2">
//                     <div>
//                       <label className={labelCls}>Statement Billing Date</label>
//                       <input
//                         type="date"
//                         value={billingDate}
//                         onChange={(e) => setBillingDate(e.target.value)}
//                         className={inputCls}
//                       />
//                     </div>
//                     <div>
//                       <label className={labelCls}>Prepared/Approved By</label>
//                       <input
//                         type="text"
//                         value={preparedBy}
//                         onChange={(e) => setPreparedBy(e.target.value)}
//                         placeholder="Authority officer"
//                         className={inputCls}
//                       />
//                     </div>
//                   </div>
//                 </div>

//               </div>
//             </div>

//             {/* Core Editable Transaction Grid (Interactivity equivalent to File 2 Invoice Rows) */}
//             <div className="rounded bg-white border border-gray-200 shadow-sm overflow-hidden">
//               <table className="w-full text-left border-collapse">
//                 <thead className="bg-[#f4f5f8] border-b border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-wider">
//                   <tr>
//                     <th className="p-2 border-r border-gray-200 w-[140px]">Date</th>
//                     <th className="p-2 border-r border-gray-200">Transaction Type</th>
//                     <th className="p-2 border-r border-gray-200">Ref No.</th>
//                     <th className="p-2 border-r border-gray-200 w-[110px]">Status</th>
//                     <th className="p-2 border-r border-gray-200 text-right w-[110px]">Total</th>
//                     <th className="p-2 border-r border-gray-200 text-right w-[110px]">Recd/Paid</th>
//                     <th className="p-2 border-r border-gray-200 text-right w-[110px]">Tnx Bal</th>
//                     <th className="p-2 border-r border-gray-200 text-right w-[110px]">Receivable Bal</th>
//                     <th className="p-2 border-r border-gray-200 text-right w-[110px]">Payable Bal</th>
//                     <th className="p-2 text-center w-[40px]"></th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 bg-white">
//                   {items.length > 0 ? (
//                     items.map((item) => (
//                       <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
//                         <td className="p-1 border-r border-gray-200">
//                           <input
//                             type="date"
//                             value={item.date}
//                             onChange={(e) => updateItem(item.id, "date", e.target.value)}
//                             className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-[13px]"
//                           />
//                         </td>
//                         <td className="p-1 border-r border-gray-200">
//                           <input
//                             type="text"
//                             value={item.tnxType}
//                             onChange={(e) => updateItem(item.id, "tnxType", e.target.value)}
//                             placeholder="Tnx Type"
//                             className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-[13px]"
//                           />
//                         </td>
//                         <td className="p-1 border-r border-gray-200">
//                           <input
//                             type="text"
//                             value={item.refNo}
//                             onChange={(e) => updateItem(item.id, "refNo", e.target.value)}
//                             placeholder="Ref No"
//                             className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-[13px] font-mono"
//                           />
//                         </td>
//                         <td className="p-1 border-r border-gray-200">
//                           <select
//                             value={item.paymentStatus}
//                             onChange={(e) => updateItem(item.id, "paymentStatus", e.target.value as any)}
//                             className="w-full bg-transparent border-0 p-1 text-[11px] font-bold cursor-pointer"
//                           >
//                             <option value="Paid" className="text-green-700">Paid</option>
//                             <option value="Unpaid" className="text-amber-700">Unpaid</option>
//                           </select>
//                         </td>
//                         <td className="p-1 border-r border-gray-200">
//                           <input
//                             type="number"
//                             value={getNumericInputValue(item.total)}
//                             onChange={(e) => updateItem(item.id, "total", e.target.value)}
//                             className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px]"
//                             placeholder="0"
//                           />
//                         </td>
//                         <td className="p-1 border-r border-gray-200">
//                           <input
//                             type="number"
//                             value={getNumericInputValue(item.receivedPaid)}
//                             onChange={(e) => updateItem(item.id, "receivedPaid", e.target.value)}
//                             className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px]"
//                             placeholder="0"
//                           />
//                         </td>
//                         <td className="p-2 border-r border-gray-200 text-right font-semibold text-slate-700 bg-slate-50/40">
//                           ₹{item.tnxBalance.toLocaleString("en-IN")}
//                         </td>
//                         <td className="p-1 border-r border-gray-200">
//                           <input
//                             type="number"
//                             value={getNumericInputValue(item.receivableBalance)}
//                             onChange={(e) => updateItem(item.id, "receivableBalance", e.target.value)}
//                             className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px] text-blue-700 font-medium"
//                             placeholder="0"
//                           />
//                         </td>
//                         <td className="p-1 border-r border-gray-200">
//                           <input
//                             type="number"
//                             value={getNumericInputValue(item.payableBalance)}
//                             onChange={(e) => updateItem(item.id, "payableBalance", e.target.value)}
//                             className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px] text-red-700 font-medium"
//                             placeholder="0"
//                           />
//                         </td>
//                         <td className="p-1 text-center">
//                           <button
//                             type="button"
//                             onClick={() => removeItem(item.id)}
//                             className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
//                           >
//                             <Trash2 size={13} />
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={10} className="p-8 text-center text-gray-400 italic">
//                         No ledger statement records linked. Use the action bar button above to generate manual line entries.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
              
//               {/* Aggregate Summaries Row */}
//               {items.length > 0 && (
//                 <div className="bg-[#f8fafc] border-t border-gray-200 px-4 py-3 flex flex-wrap justify-end gap-x-6 gap-y-2 text-[13px]">
//                   <div className="text-slate-600">Total: <span className="font-bold text-slate-900">₹{totals.total.toLocaleString("en-IN")}</span></div>
//                   <div className="text-slate-600">Total Paid: <span className="font-bold text-slate-900">₹{totals.receivedPaid.toLocaleString("en-IN")}</span></div>
//                   <div className="text-blue-700">Receivable: <span className="font-bold">₹{totals.receivableBalance.toLocaleString("en-IN")}</span></div>
//                   <div className="text-red-700">Payable: <span className="font-bold">₹{totals.payableBalance.toLocaleString("en-IN")}</span></div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ══════════════════════════════════════════════════════════════
//             PRINT & HIGH-FIDELITY PREVIEW SCREEN (Matches exact Invoice)
//            ══════════════════════════════════════════════════════════════ */}
//         <div className={`${!showPreview ? "hidden" : "block"} ${printMode ? "block" : ""}`}>
//           {/* Controls visible only during on-screen preview */}
//           <div className="flex items-center justify-between gap-4 border-b border-gray-300 bg-slate-100 px-6 py-2.5 print:hidden">
//             <span className="text-sm font-semibold text-slate-700">Sheet Print Preview</span>
//             <div className="flex gap-2">
//               <button
//                 type="button"
//                 onClick={() => setShowPreview(false)}
//                 className="rounded border border-gray-300 bg-white px-3 py-1 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
//               >
//                 Back to Editing
//               </button>
//               <button
//                 type="button"
//                 onClick={handlePrint}
//                 className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white shadow hover:bg-blue-700"
//               >
//                 <Printer size={13} /> Print Now
//               </button>
//             </div>
//           </div>

//           <div className="p-4 md:p-8 bg-[#e8eaf0] min-h-screen">
//             <div className="mx-auto w-full max-w-[800px] bg-white p-6 shadow-lg border border-slate-300">
              
//               {/* Header section identical to Invoice */}
//               <div className="border-b border-slate-200 pb-4">
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-start gap-4">
//                     <img
//                       src="/LOGO.png"
//                       alt="Company logo"
//                       className="h-16 w-16 object-contain rounded"
//                     />
//                     <div>
//                       <h3 className="text-xl font-bold text-slate-900 leading-tight">RADIATECH ELECTRA</h3>
//                       <p className="mt-1 text-[11px] text-slate-500 leading-normal max-w-sm">
//                         Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
//                       </p>
//                       <p className="text-[11px] text-slate-500">Phone: +91 81788 50959 | Email: sales@radiatech.in</p>
//                     </div>
//                   </div>
//                   <div className="text-right text-[11px] text-slate-600">
//                     <div className="font-bold text-slate-900 text-sm">PARTY STATEMENT</div>
//                     <div>Date: {billingDate}</div>
//                     <div className="mt-1 text-slate-500">GST: 09DDZPK0004H1ZF</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Subject block */}
//               <div className="mt-4 bg-slate-800 text-white text-center py-1.5 text-xs uppercase font-bold tracking-wider">
//                 Financial Statement Ledger
//               </div>

//               {/* Customer Information Cards */}
//               <div className="grid grid-cols-2 gap-4 mt-4 text-[11px] text-slate-700">
//                 <div className="border border-slate-200 p-3 rounded bg-slate-50/50">
//                   <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-slate-500 mb-1">CLIENT BILLING INFO</div>
//                   <div className="font-bold text-[13px] text-slate-900">{customerName || "Customer Name Missing"}</div>
//                   {customerCompany && <div className="text-slate-600">{customerCompany}</div>}
//                   {customerAddress && <div className="mt-1 text-slate-500 max-w-xs">{customerAddress}</div>}
//                   {customerGst && <div className="mt-1 font-mono text-[10px] text-slate-600">GSTIN: {customerGst}</div>}
//                 </div>

//                 <div className="border border-slate-200 p-3 rounded bg-slate-50/50 flex flex-col justify-between">
//                   <div>
//                     <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-slate-500 mb-1">PERIOD DURATION</div>
//                     <div className="text-[12px] text-slate-800">
//                       <span className="font-semibold text-slate-500">From:</span> {durationFrom} <span className="font-semibold text-slate-500">To:</span> {durationTo}
//                     </div>
//                   </div>
//                   <div className="mt-2 text-right pt-2 border-t border-slate-200 text-slate-500">
//                     Prepared By: <span className="font-bold text-slate-700">{preparedBy}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* High Fidelity Print Ledger Grid */}
//               <table className="w-full text-[11px] text-left mt-6 border border-collapse border-slate-300">
//                 <thead>
//                   <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
//                     <th className="p-2 border-r border-slate-300">Date</th>
//                     <th className="p-2 border-r border-slate-300">Type</th>
//                     <th className="p-2 border-r border-slate-300">Ref / Invoice No.</th>
//                     <th className="p-2 border-r border-slate-300 text-center">Status</th>
//                     <th className="p-2 border-r border-slate-300 text-right">Total</th>
//                     <th className="p-2 border-r border-slate-300 text-right">Rec/Paid</th>
//                     <th className="p-2 border-r border-slate-300 text-right">Tnx Bal</th>
//                     <th className="p-2 border-r border-slate-300 text-right">Receivable</th>
//                     <th className="p-2 text-right">Payable</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-200">
//                   {items.map((item) => (
//                     <tr key={item.id} className="hover:bg-slate-50/50">
//                       <td className="p-2 border-r border-slate-200 font-mono">{item.date}</td>
//                       <td className="p-2 border-r border-slate-200">{item.tnxType}</td>
//                       <td className="p-2 border-r border-slate-200 font-mono">{item.refNo}</td>
//                       <td className="p-2 border-r border-slate-200 text-center">
//                         <span className={`px-1 rounded text-[9px] font-bold ${item.paymentStatus === "Paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
//                           {item.paymentStatus}
//                         </span>
//                       </td>
//                       <td className="p-2 border-r border-slate-200 text-right">₹{item.total.toLocaleString("en-IN")}</td>
//                       <td className="p-2 border-r border-slate-200 text-right">₹{item.receivedPaid.toLocaleString("en-IN")}</td>
//                       <td className="p-2 border-r border-slate-200 text-right">₹{item.tnxBalance.toLocaleString("en-IN")}</td>
//                       <td className="p-2 border-r border-slate-200 text-right text-blue-700 font-medium">₹{item.receivableBalance.toLocaleString("en-IN")}</td>
//                       <td className="p-2 text-right text-red-700 font-medium">₹{item.payableBalance.toLocaleString("en-IN")}</td>
//                     </tr>
//                   ))}
                  
//                   {/* Total Summary Breakdown row */}
//                   <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900">
//                     <td colSpan={4} className="p-2 text-center uppercase tracking-wider text-[10px] border-r border-slate-300">Total Account Summary</td>
//                     <td className="p-2 text-right border-r border-slate-200">₹{totals.total.toLocaleString("en-IN")}</td>
//                     <td className="p-2 text-right border-r border-slate-200">₹{totals.receivedPaid.toLocaleString("en-IN")}</td>
//                     <td className="p-2 text-right border-r border-slate-200">₹{totals.tnxBalance.toLocaleString("en-IN")}</td>
//                     <td className="p-2 text-right border-r border-slate-200 text-blue-800">₹{totals.receivableBalance.toLocaleString("en-IN")}</td>
//                     <td className="p-2 text-right text-red-800">₹{totals.payableBalance.toLocaleString("en-IN")}</td>
//                   </tr>
//                 </tbody>
//               </table>

//               {/* Financial Declaration & Signatures */}
//               <div className="mt-8 flex justify-between items-end border-t border-slate-200 pt-6 text-[11px]">
//                 <div className="text-slate-500 max-w-sm">
//                   <p className="font-semibold text-slate-800">Declaration Statement</p>
//                   <p className="mt-1 leading-relaxed">
//                     This is a dynamically generated accounting document showing current verified transactional debits and credits between Radiatech Electra and the party mentioned above.
//                   </p>
//                 </div>
//                 <div className="text-center w-48 border-t border-slate-400 pt-2 font-semibold text-slate-800">
//                   Authorized Seal & Signature
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       </div>
//     </AdminShell>
//   );
// }


"use client";

import AdminShell from "@/components/admin/AdminShell";
import { companyInfo } from "@/data/company";
import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
import { ChevronDown, Plus, Printer, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ────────────────────────────────────────────────────────────────────────
// Interfaces & Types
// ────────────────────────────────────────────────────────────────────────

interface ProductOption {
  id: string;
  name: string;
  unit: string;
  price?: number | null;
}

interface ProductApiResponse {
  id: string;
  name: string;
  unit?: string;
  price?: number | null;
  pricePerMeter?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface StatementItem {
  id: number;
  date: string;
  tnxType: string;
  refNo: string;
  paymentStatus: "Paid" | "Unpaid";
  total: number;
  receivedPaid: number;
  tnxBalance: number;
  receivableBalance: number;
  payableBalance: number;
}

const today = new Date().toISOString().slice(0, 10);

export default function PendingMaterialBillsPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [items, setItems] = useState<StatementItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Customer and Duration States
  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerGst, setCustomerGst] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [billingDate, setBillingDate] = useState(today);
  const [durationFrom, setDurationFrom] = useState(today);
  const [durationTo, setDurationTo] = useState(today);

  const [preparedBy, setPreparedBy] = useState(
    companyInfo?.ceo || "Authorized Signatory"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  // ────────────────────────────────────────────────────────────────────────
  // Side Effects & Data Fetching
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let ignore = false;

    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        if (!response.ok) throw new Error("Unable to load customers");

        const data = await response.json();
        const customerList = Array.isArray(data) ? data : data?.items ?? [];

        if (!ignore) {
          const normalizedCustomers = customerList.map((customer: CustomerOption) => ({
            id: customer.id,
            name: customer.name,
            contactPerson: customer.contactPerson ?? "",
            phone: customer.phone ?? "",
            email: customer.email ?? "",
            gstin: customer.gstin ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            state: customer.state ?? "",
            pincode: customer.pincode ?? "",
          }));

          setCustomers(normalizedCustomers);
        }
      } catch {
        if (!ignore) setCustomers([]);
      } finally {
        if (!ignore) setLoadingCustomers(false);
      }
    };

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products?admin=true");
        if (!response.ok) throw new Error("Unable to load products");

        const data = await response.json();
        const productList = Array.isArray(data) ? data : data?.items ?? [];

        if (!ignore) {
          const normalizedProducts = productList.map((product: ProductApiResponse) => ({
            id: product.id,
            name: product.name,
            unit: product.unit ?? "",
            price:
              typeof (product as any).price === "number"
                ? (product as any).price
                : Number.parseFloat(product.pricePerMeter || "0") || 0,
          }));

          setProducts(normalizedProducts);
          setSelectedProductId((current) => current || normalizedProducts[0]?.id || "");
        }
      } catch {
        if (!ignore) setProducts([]);
      } finally {
        if (!ignore) setLoadingProducts(false);
      }
    };

    void loadCustomers();
    void loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // Logic Handlers
  // ────────────────────────────────────────────────────────────────────────

  const populateCustomerDetails = (customer: CustomerOption | null) => {
    setCustomerName(customer?.name ?? "");
    setCustomerCompany(customer?.contactPerson ?? "");
    setCustomerGst(customer?.gstin ?? "");
    setCustomerPhone(customer?.phone ?? "");
    setCustomerEmail(customer?.email ?? "");

    const addressParts = [
      customer?.address,
      customer?.city,
      customer?.state,
      customer?.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    setCustomerAddress(addressParts);
  };

  const loadCustomerInvoices = async (customer: CustomerOption) => {
    setLoadingInvoices(true);
    setItems([]);

    try {
      const response = await fetch("/api/admin/payment-invoices");
      if (!response.ok) throw new Error("Unable to load payment-in invoices");

      const data = await response.json();
      const invoiceList = Array.isArray(data?.invoices) ? data.invoices : [];

      const customerInvoices = invoiceList
        .filter((invoice: any) => {
          const partyNameStr = String(invoice.partyName || "").trim().toLowerCase();
          const customerNameStr = String(customer.name || "").trim().toLowerCase();
          return (
            partyNameStr &&
            (partyNameStr === customerNameStr ||
              partyNameStr.includes(customerNameStr) ||
              customerNameStr.includes(partyNameStr))
          );
        })
        .sort((a: any, b: any) => {
          const left = new Date(a.invoiceDate || 0).getTime();
          const right = new Date(b.invoiceDate || 0).getTime();
          return right - left;
        })
        .map((invoice: any) => {
          const total = Number(invoice.grandTotal || 0);
          const paid = Number(invoice.totalPaid || 0);
          const remaining = Number(invoice.remaining ?? Math.max(total - paid, 0));

          return {
            id:
              Number(String(invoice.id).replace(/[^0-9]/g, "")) ||
              Date.now() + Math.random(),
            date: invoice.invoiceDate
              ? new Date(invoice.invoiceDate).toISOString().slice(0, 10)
              : today,
            tnxType: invoice.paymentMode
              ? `Invoice (${invoice.paymentMode})`
              : "Invoice",
            refNo: getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, false) || "—",
            paymentStatus: remaining > 0 ? ("Unpaid" as const) : ("Paid" as const),
            total,
            receivedPaid: paid,
            tnxBalance: Number((total - paid).toFixed(2)),
            receivableBalance: remaining,
            payableBalance: 0,
          };
        });

      setItems(customerInvoices);
    } catch {
      setItems([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleCustomerSelection = async (customerId: string) => {
    setSelectedCustomerId(customerId);

    if (!customerId) {
      populateCustomerDetails(null);
      setItems([]);
      return;
    }

    const customer = customers.find((entry) => entry.id === customerId) || null;
    populateCustomerDetails(customer);

    if (customer) {
      await loadCustomerInvoices(customer);
    } else {
      setItems([]);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // Calculations & Row Mutations
  // ────────────────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += item.total;
        acc.receivedPaid += item.receivedPaid;
        acc.tnxBalance += item.tnxBalance;
        acc.receivableBalance += item.receivableBalance;
        acc.payableBalance += item.payableBalance;
        return acc;
      },
      {
        total: 0,
        receivedPaid: 0,
        tnxBalance: 0,
        receivableBalance: 0,
        payableBalance: 0,
      }
    );
  }, [items]);

  const getNumericInputValue = (value: number) => (value === 0 ? "" : value);

  const addNewTransactionRow = () => {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        date: today,
        tnxType: "Sales",
        refNo: `REF-${Date.now().toString().slice(-4)}`,
        paymentStatus: "Unpaid",
        total: 0,
        receivedPaid: 0,
        tnxBalance: 0,
        receivableBalance: 0,
        payableBalance: 0,
      },
    ]);
  };

  const updateItem = (
    id: number,
    key: keyof StatementItem,
    value: string | number
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [key]: value } as StatementItem;

        if (
          ["total", "receivedPaid", "receivableBalance", "payableBalance"].includes(
            key
          )
        ) {
          const num = Number(value);
          updatedItem[key as "total" | "receivedPaid" | "receivableBalance" | "payableBalance"] =
            Number.isFinite(num) ? num : 0;
        }

        if (key === "total" || key === "receivedPaid") {
          updatedItem.tnxBalance = updatedItem.total - updatedItem.receivedPaid;
        }

        return updatedItem;
      })
    );
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handlePrint = () => {
    setShowPreview(true);
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 300);
  };

  // ────────────────────────────────────────────────────────────────────────
  // Styles
  // ────────────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 placeholder-gray-400";

  const selectCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";

  const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

  return (
    <AdminShell
      title="Party Statement & Bills"
      description="Update ledger sheets, track payments, monitor balances and print clear client transaction sheets."
    >
      {/* Global CSS rules to ensure print view works properly */}
      <style>{`
        @media print {
          /* Hide all surrounding layout components from the AdminShell */
          body * {
            visibility: hidden !important;
          }
          /* Show only the print container */
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#e8eaf0] font-sans text-[13px] print:bg-white print:min-h-0">
        {/* ══════════════════════════════════════════════════════════════
            DATA-ENTRY SCREEN
           ══════════════════════════════════════════════════════════════ */}
        <div
          className={`${
            showPreview ? "hidden" : "block"
          } ${printMode ? "hidden" : ""} print:hidden`}
        >
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-gray-800">
                Statement Customization
              </span>
              {loadingInvoices && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  Loading invoices...
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addNewTransactionRow}
                className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus size={14} /> Add Row Entry
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Preview Sheet
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Printer size={14} /> Print Statement
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] p-3 space-y-3">
            {/* Customer & Statement Period Layout */}
            <div className="rounded bg-white border border-gray-200 shadow-sm p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Saved Customer Dropdown Selection */}
                <div className="space-y-2">
                  <div>
                    <label className={`${labelCls} text-blue-600`}>
                      Select Saved Customer
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => void handleCustomerSelection(e.target.value)}
                        className={`${selectCls} border-blue-400 ring-1 ring-blue-200 pr-7`}
                        disabled={loadingCustomers}
                      >
                        <option value="">Choose customer from saved records</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.phone ? `• ${customer.phone}` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"
                      />
                    </div>
                    {loadingCustomers && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        Loading customer database...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Customer Name / Company</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Additional Customer Fields */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Contact Person</label>
                      <input
                        type="text"
                        value={customerCompany}
                        onChange={(e) => setCustomerCompany(e.target.value)}
                        placeholder="Contact representative"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>GSTIN</label>
                      <input
                        type="text"
                        value={customerGst}
                        onChange={(e) => setCustomerGst(e.target.value)}
                        placeholder="GST identification"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Billing Address Details</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Complete location address"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Date Ranges and Timeline Customizer */}
                <div className="space-y-2 bg-[#f8fafc] border border-slate-100 rounded-lg p-3">
                  <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Statement Timeline
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>From Date</label>
                      <input
                        type="date"
                        value={durationFrom}
                        onChange={(e) => setDurationFrom(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>To Date</label>
                      <input
                        type="date"
                        value={durationTo}
                        onChange={(e) => setDurationTo(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className={labelCls}>Statement Billing Date</label>
                      <input
                        type="date"
                        value={billingDate}
                        onChange={(e) => setBillingDate(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Prepared/Approved By</label>
                      <input
                        type="text"
                        value={preparedBy}
                        onChange={(e) => setPreparedBy(e.target.value)}
                        placeholder="Authority officer"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Grid */}
            <div className="rounded bg-white border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f4f5f8] border-b border-gray-200 text-gray-700 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-2 border-r border-gray-200 w-[140px]">Date</th>
                    <th className="p-2 border-r border-gray-200">Transaction Type</th>
                    <th className="p-2 border-r border-gray-200">Ref No.</th>
                    <th className="p-2 border-r border-gray-200 w-[110px]">Status</th>
                    <th className="p-2 border-r border-gray-200 text-right w-[110px]">
                      Total
                    </th>
                    <th className="p-2 border-r border-gray-200 text-right w-[110px]">
                      Recd/Paid
                    </th>
                    <th className="p-2 border-r border-gray-200 text-right w-[110px]">
                      Tnx Bal
                    </th>
                    <th className="p-2 border-r border-gray-200 text-right w-[110px]">
                      Receivable Bal
                    </th>
                    <th className="p-2 border-r border-gray-200 text-right w-[110px]">
                      Payable Bal
                    </th>
                    <th className="p-2 text-center w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-1 border-r border-gray-200">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateItem(item.id, "date", e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-[13px]"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200">
                          <input
                            type="text"
                            value={item.tnxType}
                            onChange={(e) => updateItem(item.id, "tnxType", e.target.value)}
                            placeholder="Tnx Type"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-[13px]"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200">
                          <input
                            type="text"
                            value={item.refNo}
                            onChange={(e) => updateItem(item.id, "refNo", e.target.value)}
                            placeholder="Ref No"
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-[13px] font-mono"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200">
                          <select
                            value={item.paymentStatus}
                            onChange={(e) =>
                              updateItem(item.id, "paymentStatus", e.target.value as any)
                            }
                            className="w-full bg-transparent border-0 p-1 text-[11px] font-bold cursor-pointer"
                          >
                            <option value="Paid" className="text-green-700">
                              Paid
                            </option>
                            <option value="Unpaid" className="text-amber-700">
                              Unpaid
                            </option>
                          </select>
                        </td>
                        <td className="p-1 border-r border-gray-200">
                          <input
                            type="number"
                            value={getNumericInputValue(item.total)}
                            onChange={(e) => updateItem(item.id, "total", e.target.value)}
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px]"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200">
                          <input
                            type="number"
                            value={getNumericInputValue(item.receivedPaid)}
                            onChange={(e) =>
                              updateItem(item.id, "receivedPaid", e.target.value)
                            }
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px]"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200 text-right font-semibold text-slate-700 bg-slate-50/40">
                          ₹{item.tnxBalance.toLocaleString("en-IN")}
                        </td>
                        <td className="p-1 border-r border-gray-200">
                          <input
                            type="number"
                            value={getNumericInputValue(item.receivableBalance)}
                            onChange={(e) =>
                              updateItem(item.id, "receivableBalance", e.target.value)
                            }
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px] text-blue-700 font-medium"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200">
                          <input
                            type="number"
                            value={getNumericInputValue(item.payableBalance)}
                            onChange={(e) =>
                              updateItem(item.id, "payableBalance", e.target.value)
                            }
                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-300 p-1 text-right text-[13px] text-red-700 font-medium"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                        No ledger statement records linked. Use the action bar button above
                        to generate manual line entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Aggregate Summaries Row */}
              {items.length > 0 && (
                <div className="bg-[#f8fafc] border-t border-gray-200 px-4 py-3 flex flex-wrap justify-end gap-x-6 gap-y-2 text-[13px]">
                  <div className="text-slate-600">
                    Total:{" "}
                    <span className="font-bold text-slate-900">
                      ₹{totals.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Total Paid:{" "}
                    <span className="font-bold text-slate-900">
                      ₹{totals.receivedPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-blue-700">
                    Receivable:{" "}
                    <span className="font-bold">
                      ₹{totals.receivableBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-red-700">
                    Payable:{" "}
                    <span className="font-bold">
                      ₹{totals.payableBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PRINT & HIGH-FIDELITY PREVIEW SCREEN
           ══════════════════════════════════════════════════════════════ */}
        <div
          id="print-area"
          className={`${
            !showPreview && !printMode ? "hidden" : "block"
          } print:block`}
        >
          {/* Controls visible only during on-screen preview */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-300 bg-slate-100 px-6 py-2.5 print:hidden">
            <span className="text-sm font-semibold text-slate-700">
              Sheet Print Preview
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded border border-gray-300 bg-white px-3 py-1 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white shadow hover:bg-blue-700"
              >
                <Printer size={13} /> Print Now
              </button>
            </div>
          </div>

          <div className="p-4 md:p-8 bg-[#e8eaf0] min-h-screen print:p-0 print:bg-white print:min-h-0">
            <div className="mx-auto w-full max-w-[800px] bg-white p-6 shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-0">
              {/* Header section */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src="/LOGO.png"
                      alt="Company logo"
                      className="h-16 w-16 object-contain rounded"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        RADIATECH ELECTRA
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-500 leading-normal max-w-sm">
                        Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar
                        Pradesh, 201301
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Phone: +91 81788 50959 | Email: sales@radiatech.in
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-600">
                    <div className="font-bold text-slate-900 text-sm">
                      PARTY STATEMENT
                    </div>
                    <div>Date: {billingDate}</div>
                    <div className="mt-1 text-slate-500">GST: 09DDZPK0004H1ZF</div>
                  </div>
                </div>
              </div>

              {/* Subject block */}
              <div className="mt-4 bg-slate-800 text-white text-center py-1.5 text-xs uppercase font-bold tracking-wider print:bg-slate-800 print:text-white">
                Financial Statement Ledger
              </div>

              {/* Customer Information Cards */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-[11px] text-slate-700">
                <div className="border border-slate-200 p-3 rounded bg-slate-50/50">
                  <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-slate-500 mb-1">
                    BILLING INFO
                  </div>
                  <div className="font-bold text-[13px] text-slate-900">
                    {customerName || "Customer Name Missing"}
                  </div>
                  {customerCompany && (
                    <div className="text-slate-600">{customerCompany}</div>
                  )}
                  {customerPhone && (
                    <div className="mt-1 text-slate-600">Mob: {customerPhone}</div>
                  )}
                  {customerAddress && (
                    <div className="mt-1 text-slate-500 max-w-xs">{customerAddress}</div>
                  )}
                  {customerGst && (
                    <div className="mt-1 font-mono text-[10px] text-slate-600">
                      GSTIN: {customerGst}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 p-3 rounded bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-slate-500 mb-1">
                      PERIOD DURATION
                    </div>
                    <div className="text-[12px] text-slate-800">
                      <span className="font-semibold text-slate-500">From:</span>{" "}
                      {durationFrom}{" "}
                      <span className="font-semibold text-slate-500">To:</span>{" "}
                      {durationTo}
                    </div>
                  </div>
                  <div className="mt-2 text-right pt-2 border-t border-slate-200 text-slate-500">
                    Prepared By:{" "}
                    <span className="font-bold text-slate-700">{preparedBy}</span>
                  </div>
                </div>
              </div>

              {/* High Fidelity Print Ledger Grid */}
              <table className="w-full text-[11px] text-left mt-6 border border-collapse border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Date</th>
                    <th className="p-2 border-r border-slate-300">Type</th>
                    <th className="p-2 border-r border-slate-300">
                      Ref / Invoice No.
                    </th>
                    <th className="p-2 border-r border-slate-300 text-center">
                      Status
                    </th>
                    <th className="p-2 border-r border-slate-300 text-right">Total</th>
                    <th className="p-2 border-r border-slate-300 text-right">
                      Rec/Paid
                    </th>
                    <th className="p-2 border-r border-slate-300 text-right">
                      Tnx Bal
                    </th>
                    <th className="p-2 border-r border-slate-300 text-right">
                      Receivable
                    </th>
                    <th className="p-2 text-right">Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2 border-r border-slate-200 font-mono">
                        {item.date}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        {item.tnxType}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono">
                        {item.refNo}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span
                          className={`px-1 rounded text-[9px] font-bold ${
                            item.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right">
                        ₹{item.total.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right">
                        ₹{item.receivedPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right">
                        ₹{item.tnxBalance.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-blue-700 font-medium">
                        ₹{item.receivableBalance.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2 text-right text-red-700 font-medium">
                        ₹{item.payableBalance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}

                  {/* Total Summary Breakdown row */}
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900">
                    <td
                      colSpan={4}
                      className="p-2 text-center uppercase tracking-wider text-[10px] border-r border-slate-300"
                    >
                      Total Account Summary
                    </td>
                    <td className="p-2 text-right border-r border-slate-200">
                      ₹{totals.total.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2 text-right border-r border-slate-200">
                      ₹{totals.receivedPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2 text-right border-r border-slate-200">
                      ₹{totals.tnxBalance.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2 text-right border-r border-slate-200 text-blue-800">
                      ₹{totals.receivableBalance.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2 text-right text-red-800">
                      ₹{totals.payableBalance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Declaration & Signatures */}
              <div className="mt-8 flex justify-between items-end border-t border-slate-200 pt-6 text-[11px]">
                <div className="text-slate-500 max-w-sm">
                  <p className="font-semibold text-slate-800">
                    
                  </p>
                  <p className="mt-1 leading-relaxed">
                  
                  </p>
                </div>
               
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}