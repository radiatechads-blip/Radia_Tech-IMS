//customers/page.tsx
"use client";

import AdminShell from "@/components/admin/AdminShell";
import Pagination from "@/components/admin/Pagination";
import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface InvoiceTransaction {
  id: string;
  billType: string;
  invoiceNumber: string;
  invoiceDate: string;
  grandTotal: number;
  balance: number;
}

type CustomersResponse = {
  items: Customer[];
  pagination: PaginationState;
};

const pageSize = 10;

const initialFormState = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [form, setForm] = useState(initialFormState);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Transaction modal state
  const [transactionModal, setTransactionModal] = useState<{ customerId: string; customerName: string } | null>(null);
  const [transactions, setTransactions] = useState<InvoiceTransaction[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchCustomers = async (pageNumber = 1, signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pageNumber), pageSize: String(pageSize) });
      if (searchQuery) params.append("search", searchQuery);
      const response = await fetch(`/api/customers?${params.toString()}`, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load customers.");
      if (signal?.aborted) return;
      setCustomers((data as CustomersResponse).items || []);
      setPagination((data as CustomersResponse).pagination || { page: pageNumber, pageSize, total: 0, totalPages: 1 });
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadCustomers = async () => {
      await fetchCustomers(page, controller.signal);
    };

    void loadCustomers();

    return () => controller.abort();
  }, [page, searchQuery]);

  const resetForm = () => {
    setForm(initialFormState);
    setEditingCustomerId(null);
    setFormError("");
    setSuccessMessage("");
  };

  const handleEditClick = (customer: Customer) => {
    setForm({
      name: customer.name || "",
      contactPerson: customer.contactPerson || "",
      phone: customer.phone || "",
      email: customer.email || "",
      gstin: customer.gstin || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
    });
    setEditingCustomerId(customer.id);
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  };

  const handleDeleteClick = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete customer.");
      
      setSuccessMessage("Customer deleted successfully.");
      // Refresh current page list
      void fetchCustomers(page);
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Unable to delete customer.");
    }
  };

  const openTransactionModal = async (customerId: string, customerName: string) => {
    setTransactionModal({ customerId, customerName });
    setTransactionLoading(true);
    try {
      console.log("[Client] Opening transaction modal for:", { customerId, customerName });
      const response = await fetch(`/api/customers/${customerId}/invoices?name=${encodeURIComponent(customerName)}`);
      console.log("[Client] API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("[Client] Transactions received:", data);
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        const errorMsg = `${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`;
        console.error("[Client] API Error:", errorMsg);
        alert(`Error fetching invoices: ${errorMsg}`);
        setTransactions([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Client] Fetch error:", errorMsg);
      alert(`Error: ${errorMsg}`);
      setTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  const closeTransactionModal = () => {
    setTransactionModal(null);
    setTransactions([]);
    setOpenMenuId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!form.name || !form.phone || !form.email) {
      setFormError("Name, phone, and email are required.");
      return;
    }

    const isEditing = !!editingCustomerId;
    const url = isEditing ? `/api/customers/${editingCustomerId}` : "/api/customers";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Unable to ${isEditing ? "update" : "create"} customer.`);
      
      if (isEditing) {
        setCustomers((current) => current.map((item) => item.id === editingCustomerId ? (data as Customer) : item));
        setSuccessMessage("Customer updated successfully.");
      } else {
        setCustomers((current) => [data as Customer, ...current]);
        setSuccessMessage("Customer added successfully.");
      }
      
      resetForm();
      setShowForm(false);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to process request.");
    }
  };

  return (
    <AdminShell
      title="Customers"
      description="Manage your customer list, update details, or remove records from one place."
      action={
        <button type="button" onClick={() => { setShowForm((visible) => !visible); resetForm(); }} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <Plus size={16} /> Add Customer
        </button>
      }
    >
      <div className="space-y-6">
        {showForm && (
          <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">
              {editingCustomerId ? "Edit Customer" : "New Customer"}
            </h2>
            {formError && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
            {successMessage && <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>}
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Name *</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Contact Person</span>
                <input value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Phone *</span>
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email *</span>
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</span>
                <input value={form.gstin} onChange={(event) => setForm({ ...form, gstin: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
                <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
                <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
                <input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} className="admin-input w-full" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Pincode</span>
                <input value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} className="admin-input w-full" />
              </label>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <button type="submit" className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
                  {editingCustomerId ? "Update Customer" : "Save Customer"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Customer List</h2>
              <p className="mt-1 text-sm text-slate-500">Manage customer contacts and billing details.</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="admin-input flex-1"
            />
            <button
              type="button"
              onClick={() => {
                setPage(1);
              }}
              className="inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>

          {loading ? (
            <div className="h-64 animate-pulse rounded bg-slate-100" />
          ) : error ? (
            <div className="rounded border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
          ) : customers.length === 0 ? (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-5 py-16 text-center text-sm text-slate-500">No customers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Contact Person</th>
                    <th className="px-5 py-3 font-semibold">Phone</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">City</th>
                    <th className="px-5 py-3 font-semibold">State</th>
                    <th className="px-5 py-3 font-semibold">GSTIN</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-950">{customer.name}</td>
                      <td className="px-5 py-4 text-slate-600">{customer.contactPerson || "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{customer.phone}</td>
                      <td className="px-5 py-4 text-slate-600">{customer.email}</td>
                      <td className="px-5 py-4 text-slate-600">{customer.city || "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{customer.state || "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{customer.gstin || "-"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openTransactionModal(customer.id, customer.name)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            title="View Transactions"
                          >
                            📊
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditClick(customer)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            title="Edit Customer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(customer.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50 hover:text-red-700"
                            title="Delete Customer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={(nextPage) => setPage(nextPage)} />
            </div>
          )}
        </section>
      </div>

      {/* Transaction Modal */}
      {transactionModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Customer Transactions</h2>
                <p className="mt-1 text-sm text-slate-600">{transactionModal.customerName}</p>
              </div>
              <button
                onClick={closeTransactionModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {transactionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-slate-500">Loading transactions...</div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  <p className="font-medium">No transactions found for this customer</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Bill Type</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Bill No.</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Grand Total</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Balance</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                              {txn.billType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{getDuplicateCopyInvoiceNumber(txn.invoiceNumber, false)}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {new Date(txn.invoiceDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            ₹{txn.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-accent">
                            ₹{txn.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="relative inline-block">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === txn.id ? null : txn.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                title="More actions"
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                  <circle cx="12" cy="5" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="12" cy="19" r="2" />
                                </svg>
                              </button>
                              
                              {openMenuId === txn.id && (
                                <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                                  <button
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      const previewWindow = window.open("", "_blank");
                                      if (!previewWindow) {
                                        alert("Please allow pop-ups to open preview.");
                                        return;
                                      }
                                      previewWindow.document.write("<p>Loading preview...</p>");
                                      // Preview action - will navigate to preview
                                      window.location.href = `/admin/generate-bill?invoiceId=${txn.id}`;
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                                  >
                                    👁️ Preview
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      // Edit/View action
                                      window.location.href = `/admin/generate-bill/invoice?id=${txn.id}`;
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                                  >
                                    ✏️ Edit/View
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      // Open PDF action
                                      window.location.href = `/admin/generate-bill?openPdf=${txn.id}`;
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                                  >
                                    📄 Open PDF
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      const url = `${window.location.origin}/admin/generate-bill?id=${txn.id}`;
                                      try {
                                        await navigator.clipboard.writeText(url);
                                        alert("Link copied to clipboard!");
                                      } catch {
                                        alert(url);
                                      }
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    🔗 Copy Link
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={closeTransactionModal}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AdminShell>
  );
}