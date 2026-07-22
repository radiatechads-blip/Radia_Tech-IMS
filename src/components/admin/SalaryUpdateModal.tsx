"use client";

import { addStoredSalaryRecord } from "@/lib/localEmployeeStorage";
import { IndianRupee, X } from "lucide-react";
import { useMemo, useState } from "react";

export interface EmployeeRecord {
  id: string;
  emp_id: string;
  name: string;
  job_role?: string;
  department?: string;
  salary: number;
  photo_url?: string;
}

interface Props {
  employees: EmployeeRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalaryUpdateModal({ employees, onClose, onSuccess }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(() => employees.find((e) => e.id === selectedId), [employees, selectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setError("Please select an employee.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      addStoredSalaryRecord(selectedId, Number.parseFloat(amount) || 0, remark.trim(), paidAt || undefined);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to save salary record.");
      return;
    }

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
              <IndianRupee size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Salary Update</h2>
              <p className="text-xs text-gray-500">Record a salary payment</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100" type="button">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Select Employee</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            >
              <option value="">-- Select an employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.emp_id} — {emp.name}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              {selected.photo_url ? (
                <img src={selected.photo_url} alt={selected.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200 text-sm font-semibold text-blue-700">
                  {selected.name[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-500">
                  {selected.job_role} • {selected.department}
                </p>
                <p className="mt-0.5 text-xs font-medium text-blue-600">
                  Current Salary: ₹{selected.salary.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
              <input
                type="number"
                required
                min={1}
                placeholder="Enter salary amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2.5 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Date</label>
            <input
              type="date"
              required
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Record / Remark</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Monthly salary for June 2025, Bonus, etc."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button onClick={onClose} type="button" className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            disabled={loading}
            type="button"
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Update Salary"}
          </button>
        </div>
      </div>
    </div>
  );
}
