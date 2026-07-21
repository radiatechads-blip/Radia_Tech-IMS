"use client";

import AdminShell from "@/components/admin/AdminShell";
import { readJsonResponse } from "@/lib/fetchJson";
import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
import { useEffect, useState } from "react";

type Reminder = {
  id: string;
  type: string;
  sentAt: string;
  meta?: string | null;
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  invoiceDate?: string | null;
  dueDate?: string | null;
  email: string;
  remindersPaused?: boolean | null;
  reminders: Reminder[];
};

type InvoiceDateFilter = "all" | "thisMonth" | "lastMonth" | "thisQuarter" | "thisYear" | "custom";

export default function AlertsPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<InvoiceDateFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const auth = await fetch("/api/auth/me");
        if (auth.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        const res = await fetch("/api/admin/invoice-reminders");
        const data = await readJsonResponse(res);
        if (!res.ok) throw new Error(data?.error || "Unable to load alerts");
        if (!cancelled) setRows(data.invoices || []);
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unable to load alerts';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendManual(invoiceId: string) {
    if (!confirm("Send reminder for this invoice now?")) return;
    try {
      const res = await fetch("/api/notifications/send-manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceId, type: "manual" }),
      });
      const data = await readJsonResponse(res);
      if (!res.ok || !data?.ok || !data?.result?.ok) {
        throw new Error(data?.error || data?.result?.error || "Send failed");
      }
      alert("Reminder sent successfully");
      // refresh
      const refreshedRes = await fetch("/api/admin/invoice-reminders");
      const refreshed = await readJsonResponse(refreshedRes);
      setRows(refreshed.invoices || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send failed';
      alert(message);
    }
  }

  async function updateReminderStatus(invoiceId: string, status: "paid" | "unpaid") {
    if (!confirm(status === "paid" ? "Pause reminders for this invoice?" : "Resume reminders for this invoice?")) return;
    setUpdatingId(invoiceId);
    try {
      const res = await fetch("/api/admin/invoice-reminders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceId, status }),
      });
      const data = await readJsonResponse(res);
      if (!res.ok) throw new Error(data?.error || "Unable to update reminder status");
      const refreshedRes = await fetch("/api/admin/invoice-reminders");
      const refreshed = await readJsonResponse(refreshedRes);
      setRows(refreshed.invoices || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to update reminder status";
      alert(message);
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function daysTo(d?: string | null) {
    if (!d) return "-";
    const due = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) return `${diff} day(s) left`;
    if (diff === 0) return `Due today`;
    return `${Math.abs(diff)} day(s) overdue`;
  }

  function getDateRangeForFilter() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (dateFilter === "custom") {
      if (!customStartDate || !customEndDate) {
        return null;
      }
      const start = new Date(`${customStartDate}T00:00:00`);
      const end = new Date(`${customEndDate}T23:59:59`);
      return { start, end };
    }

    if (dateFilter === "thisMonth") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return { start, end };
    }

    if (dateFilter === "lastMonth") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end };
    }

    if (dateFilter === "thisQuarter") {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const start = new Date(today.getFullYear(), quarterStartMonth, 1);
      const end = new Date(today.getFullYear(), quarterStartMonth + 3, 1);
      return { start, end };
    }

    if (dateFilter === "thisYear") {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear() + 1, 0, 1);
      return { start, end };
    }

    return { start: new Date(0), end: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() + 1) };
  }

  function matchesDateFilter(invoice: InvoiceRow) {
    if (dateFilter === "all") return true;

    const range = getDateRangeForFilter();
    if (!range) return true;

    const dateValue = invoice.invoiceDate || invoice.dueDate || "";
    if (!dateValue) return false;

    const invoiceDate = new Date(dateValue);
    if (Number.isNaN(invoiceDate.getTime())) return false;

    return invoiceDate >= range.start && invoiceDate < range.end;
  }

  const filteredRows = rows.filter((row) => {
    const term = searchTerm.trim().toLowerCase();
    const haystack = [row.invoiceNumber, row.partyName, row.email].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !term || haystack.includes(term);
    return matchesSearch && matchesDateFilter(row);
  });

  return (
    <AdminShell title="Alerts" description="Manage invoice reminders and send manual notices to customers.">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by invoice, name, or email..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              <span className="font-medium text-slate-700">Filter by</span>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as InvoiceDateFilter)}
                className="border-none bg-transparent pr-1 font-medium text-slate-700 outline-none"
              >
                <option value="all">All Alerts</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            {dateFilter === "custom" && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                <label className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">From</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="border-none bg-transparent font-medium text-slate-700 outline-none"
                  />
                </label>
                <span className="text-slate-400">to</span>
                <label className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">To</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="border-none bg-transparent font-medium text-slate-700 outline-none"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="text-sm font-medium text-slate-500">
            Showing {filteredRows.length} of {rows.length} entries
          </div>
        </div>

        {loading ? (
          <div className="h-24 animate-pulse border border-slate-200 bg-white" />
        ) : error ? (
          <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reminders</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-t bg-white">
                    <td className="px-3 py-2 text-sm">
                      <div className="font-medium text-slate-900">{getDuplicateCopyInvoiceNumber(r.invoiceNumber, false)}</div>
                      <div className="text-xs text-slate-400">
                        {formatDate(r.invoiceDate)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">{r.partyName} <div className="text-xs text-slate-400">{r.email}</div></td>
                    <td className="px-3 py-2 text-sm">₹{r.grandTotal.toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm">{formatDate(r.dueDate)}<div className="text-xs text-slate-400">{daysTo(r.dueDate)}</div></td>
                    <td className="px-3 py-2 text-sm">
                      {r.remindersPaused ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Paused</span>
                      ) : r.reminders.length > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Sent</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {r.reminders.map((m) => (
                        <div key={m.id} className="mb-1 text-xs text-slate-600">
                          {m.type} • {new Date(m.sentAt).toLocaleDateString()}
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => updateReminderStatus(r.id, "paid")} disabled={Boolean(r.remindersPaused) || updatingId === r.id} className="rounded bg-slate-700 px-3 py-1 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Paid</button>
                        <button onClick={() => updateReminderStatus(r.id, "unpaid")} disabled={!Boolean(r.remindersPaused) || updatingId === r.id} className="rounded bg-emerald-600 px-3 py-1 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Unpaid</button>
                        <button onClick={() => sendManual(r.id)} className="rounded bg-primary px-3 py-1 text-sm font-semibold text-white">Send Reminder</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
