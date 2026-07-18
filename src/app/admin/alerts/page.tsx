"use client";

import AdminShell from "@/components/admin/AdminShell";
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
  dueDate?: string | null;
  email: string;
  remindersPaused?: boolean | null;
  reminders: Reminder[];
};

export default function AlertsPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        const data = await res.json();
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
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.result?.ok) {
        throw new Error(data?.error || data?.result?.error || "Send failed");
      }
      alert("Reminder sent successfully");
      // refresh
      const refreshed = await (await fetch("/api/admin/invoice-reminders")).json();
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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to update reminder status");
      const refreshed = await (await fetch("/api/admin/invoice-reminders")).json();
      setRows(refreshed.invoices || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to update reminder status";
      alert(message);
    } finally {
      setUpdatingId(null);
    }
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

  return (
    <AdminShell title="Alerts" description="Manage invoice reminders and send manual notices to customers.">
      <div className="space-y-4">
        {loading ? (
          <div className="h-24 animate-pulse border border-slate-200 bg-white" />
        ) : error ? (
          <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-sm text-slate-600">
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
                {rows.map((r) => (
                  <tr key={r.id} className="border-t bg-white">
                    <td className="px-3 py-2 text-sm">{r.invoiceNumber}</td>
                    <td className="px-3 py-2 text-sm">{r.partyName} <div className="text-xs text-slate-400">{r.email}</div></td>
                    <td className="px-3 py-2 text-sm">₹{r.grandTotal.toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-' }<div className="text-xs text-slate-400">{daysTo(r.dueDate)}</div></td>
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
        )}
      </div>
    </AdminShell>
  );
}
