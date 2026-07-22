"use client";

import { addStoredSalaryRecord, deleteStoredSalaryRecord, getStoredSalaryRecords, updateStoredSalaryRecord } from "@/lib/localEmployeeStorage";
import {
    Calendar,
    FileText,
    IndianRupee,
    TrendingUp,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface EmployeeRecord {
  id: string;
  emp_id: string;
  name: string;
  job_role?: string;
  department?: string;
  salary: number;
  photo_url?: string;
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  amount: number;
  remark: string;
  paid_at: string;
}

type Filter = "all" | "this" | "last" | "half" | "year" | "jan" | "feb" | "mar" | "apr" | "may" | "jun" | "jul" | "aug" | "sep" | "oct" | "nov" | "dec";

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "this", label: "This Month" },
  { key: "last", label: "Last Month" },
  { key: "half", label: "Half Yearly" },
  { key: "year", label: "12 Months" },
];

const MONTH_FILTERS: { key: Exclude<Filter, "all" | "this" | "last" | "half" | "year">; label: string }[] = [
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Feb" },
  { key: "mar", label: "Mar" },
  { key: "apr", label: "Apr" },
  { key: "may", label: "May" },
  { key: "jun", label: "Jun" },
  { key: "jul", label: "Jul" },
  { key: "aug", label: "Aug" },
  { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
];

interface Props {
  employee: EmployeeRecord;
  onClose: () => void;
  onSalaryUpdate: () => void;
}

export default function ViewDetailsModal({ employee, onClose, onSalaryUpdate }: Props) {
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecords();
  }, [employee.id]);

  const fetchRecords = () => {
    setLoading(true);
    const result = getStoredSalaryRecords(employee.id);
    setRecords(result.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()));
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const date = new Date(record.paid_at);
      const now = new Date();

      if (filter === "this") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (filter === "last") {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === last.getMonth() && date.getFullYear() === last.getFullYear();
      }
      if (filter === "half") {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return date >= sixMonthsAgo;
      }
      if (filter === "year") {
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        return date >= twelveMonthsAgo;
      }

      const monthMap: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      if (filter in monthMap) {
        return date.getMonth() === monthMap[filter];
      }

      return true;
    });
  }, [records, filter]);

  const totalPaid = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (editingRecordId) {
        updateStoredSalaryRecord(editingRecordId, {
          amount: Number.parseFloat(amount) || 0,
          remark: remark.trim(),
          paid_at: paidAt || new Date().toISOString(),
        });
      } else {
        addStoredSalaryRecord(employee.id, Number.parseFloat(amount) || 0, remark.trim(), paidAt || undefined);
      }
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Failed to save salary record.");
      return;
    }

    setSaving(false);
    setAmount("");
    setRemark("");
    setPaidAt("");
    setShowUpdateForm(false);
    setEditingRecordId(null);
    fetchRecords();
    onSalaryUpdate();
  };

  const handleDelete = async (recordId: string) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) {
      return;
    }

    try {
      deleteStoredSalaryRecord(recordId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete salary record.");
      return;
    }

    fetchRecords();
    onSalaryUpdate();
  };

  const startEdit = (record: SalaryRecord) => {
    setEditingRecordId(record.id);
    setAmount(String(record.amount));
    setRemark(record.remark);
    setPaidAt(record.paid_at.slice(0, 10));
    setShowUpdateForm(true);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {employee.photo_url ? (
                <img src={employee.photo_url} alt={employee.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-100" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
                  {employee.name[0]}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{employee.name}</h2>
                <p className="text-xs text-gray-500">{employee.job_role} • {employee.emp_id}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100" type="button">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Salary History</span>
            </div>
            <button
              onClick={() => {
                setEditingRecordId(null);
                setAmount("");
                setRemark("");
                setPaidAt("");
                setShowUpdateForm((value) => !value);
              }}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
            >
              <TrendingUp size={13} />
              Update Salary
            </button>
          </div>
        </div>

        {showUpdateForm && (
          <div className="border-b border-green-100 bg-green-50 px-6 py-4">
            <form onSubmit={handleUpdate} className="space-y-3">
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Remark</label>
                  <input
                    type="text"
                    required
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="e.g. Monthly salary June"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Date</label>
                <input
                  type="date"
                  required
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => {
                  setShowUpdateForm(false);
                  setEditingRecordId(null);
                  setAmount("");
                  setRemark("");
                  setPaidAt("");
                }} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60">
                  {saving ? "Saving..." : editingRecordId ? "Save Changes" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex items-center gap-6 border-b border-blue-100 bg-blue-50 px-6 py-3">
          <div className="flex items-center gap-2">
            <IndianRupee size={14} className="text-blue-600" />
            <span className="text-xs text-gray-500">Monthly Salary:</span>
            <span className="text-sm font-bold text-blue-700">₹{employee.salary.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-4 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-green-600" />
            <span className="text-xs text-gray-500">Total Paid ({FILTER_LABELS.find((item) => item.key === filter)?.label}):</span>
            <span className="text-sm font-bold text-green-700">₹{totalPaid.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 pt-3 pb-2">
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="ml-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1">
            <span className="text-[11px] font-semibold text-gray-600">Month</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="bg-transparent text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="all">All</option>
              {MONTH_FILTERS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-gray-400">
              <FileText size={32} className="text-gray-300" />
              <p className="text-sm">No salary records found for this period.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 pr-4 text-left text-xs font-semibold text-gray-500">Date</th>
                  <th className="pb-2 pr-4 text-left text-xs font-semibold text-gray-500">Amount</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="whitespace-nowrap py-3 pr-4 text-sm text-gray-700">{formatDate(record.paid_at)}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-lg bg-green-50 px-2.5 py-0.5 text-sm font-semibold text-green-700">
                        ₹{record.amount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{record.remark || "—"}</td>
                    <td className="py-3 pl-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(record)}
                          className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
