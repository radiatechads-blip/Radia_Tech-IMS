"use client";

import AdminShell from "@/components/admin/AdminShell";
import Pagination from "@/components/admin/Pagination";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

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

type CustomersResponse = {
  items: Customer[];
  pagination: PaginationState;
};

const pageSize = 10;

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize, total: 0, totalPages: 1 });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchCustomers = async (pageNumber = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pageNumber), pageSize: String(pageSize) });
      const response = await fetch(`/api/customers?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load customers.");
      setCustomers((data as CustomersResponse).items || []);
      setPagination((data as CustomersResponse).pagination || { page: pageNumber, pageSize, total: 0, totalPages: 1 });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers(page);
  }, [page]);

  const resetForm = () => {
    setForm({ name: "", contactPerson: "", phone: "", email: "", gstin: "", address: "", city: "", state: "", pincode: "" });
    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!form.name || !form.phone || !form.email) {
      setFormError("Name, phone, and email are required.");
      return;
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create customer.");
      setCustomers((current) => [data as Customer, ...current]);
      setSuccessMessage("Customer added successfully.");
      resetForm();
      setShowForm(false);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to create customer.");
    }
  };

  return (
    <AdminShell
      title="Customers"
      description="Manage your customer list and add new customers from one place."
      action={
        <button type="button" onClick={() => { setShowForm((visible) => !visible); resetForm(); }} className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <Plus size={16} /> Add Customer
        </button>
      }
    >
      <div className="space-y-6">
        {showForm && (
          <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">New Customer</h2>
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
                <button type="submit" className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">Save Customer</button>
                <button type="button" onClick={() => setShowForm(false)} className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
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
            <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
              <Plus size={16} /> Add Customer
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
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Contact Person</th>
                    <th className="px-5 py-3 font-semibold">Phone</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">City</th>
                    <th className="px-5 py-3 font-semibold">State</th>
                    <th className="px-5 py-3 font-semibold">GSTIN</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={(nextPage) => setPage(nextPage)} />
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
