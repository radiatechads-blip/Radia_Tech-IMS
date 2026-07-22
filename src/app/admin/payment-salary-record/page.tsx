"use client";

import AddEmployeeModal from "@/components/admin/AddEmployeeModal";
import AdminShell from "@/components/admin/AdminShell";
import EditEmployeeModal from "@/components/admin/EditEmployeeModal";
import SalaryUpdateModal from "@/components/admin/SalaryUpdateModal";
import ViewDetailsModal from "@/components/admin/ViewDetailsModal";
import { addStoredOtherPayment, deleteStoredOtherPayment, getStoredEmployees, getStoredOtherPayments, getStoredSalaryRecords, refreshSalaryPageData, updateStoredOtherPayment } from "@/lib/localEmployeeStorage";
import {
  BadgeCheck,
  Eye,
  Filter,
  History,
  IndianRupee,
  Pencil,
  Plus,
  Users
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const sharedAvatar = "/EMP IMG.png";

export default function PaymentSalaryPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<
    | {
        id: string;
        emp_id: string;
        name: string;
        email?: string;
        mobile?: string;
        address?: string;
        aadhaar?: string;
        pan?: string;
        job_role?: string;
        department?: string;
        salary: number;
        photo_url?: string;
        createdAt?: string;
      }
    | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOtherPaymentForm, setShowOtherPaymentForm] = useState(false);
  const [showRecentPaymentsModal, setShowRecentPaymentsModal] = useState(false);
  const [recentViewMode, setRecentViewMode] = useState<"summary" | "history">("summary");
  const [showRecentFilter, setShowRecentFilter] = useState(false);
  const [recentSearch, setRecentSearch] = useState("");
  const [recentFilter, setRecentFilter] = useState<"all" | "this" | "last" | "half" | "year" | "jan" | "feb" | "mar" | "apr" | "may" | "jun" | "jul" | "aug" | "sep" | "oct" | "nov" | "dec">("all");
  const [otherPaymentName, setOtherPaymentName] = useState("");
  const [otherPaymentAmount, setOtherPaymentAmount] = useState("");
  const [otherPaymentDate, setOtherPaymentDate] = useState("");
  const [otherPaymentType, setOtherPaymentType] = useState("");
  const [otherPaymentMode, setOtherPaymentMode] = useState("");
  const [otherPaymentRemark, setOtherPaymentRemark] = useState("");
  const [otherPaymentSubmitting, setOtherPaymentSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<
    | {
        id: string;
        emp_id: string;
        name: string;
        role: string;
        department?: string;
        salary: string;
        avatar: string;
      }
    | null
  >(null);

  useEffect(() => {
    const sync = () => {
      void refreshSalaryPageData().then(() => {
        setRefreshKey((value) => value + 1);
      });
    };

    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const employeesData = useMemo(() => {
    void refreshKey;
    const storedEmployees = getStoredEmployees();

    return storedEmployees.map((employee) => {
      const currentMonthRecords = getStoredSalaryRecords(employee.id).filter((record) => {
        const date = new Date(record.paid_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      const currentMonthAmount = currentMonthRecords.reduce((sum, record) => sum + record.amount, 0);

      return {
        id: employee.id,
        emp_id: employee.emp_id,
        name: employee.name,
        role: employee.job_role || "Employee",
        department: employee.department,
        salary: `₹ ${employee.salary.toLocaleString("en-IN")}`,
        avatar: employee.photo_url || sharedAvatar,
        email: employee.email,
        mobile: employee.mobile,
        address: employee.address,
        aadhaar: employee.aadhaar,
        pan: employee.pan,
        salaryValue: employee.salary,
        currentMonthAmount: `₹ ${currentMonthAmount.toLocaleString("en-IN")}`,
      };
    });
  }, [refreshKey]);

  const otherPayments = getStoredOtherPayments();
  const salaryHistoryEntries = useMemo(() => {
    void refreshKey;
    const storedEmployees = getStoredEmployees();
    const employeeMap = new Map(storedEmployees.map((employee) => [employee.id, employee]));

    return getStoredSalaryRecords()
      .map((record) => ({
        ...record,
        employee: employeeMap.get(record.employee_id),
      }))
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  }, [refreshKey]);

  const filteredSalaryHistoryEntries = useMemo(() => {
    const term = recentSearch.trim().toLowerCase();

    return salaryHistoryEntries.filter((entry) => {
      const paid = new Date(entry.paid_at);
      const now = new Date();

      if (recentFilter === "this") {
        return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear();
      }
      if (recentFilter === "last") {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return paid.getMonth() === last.getMonth() && paid.getFullYear() === last.getFullYear();
      }
      if (recentFilter === "half") {
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return paid >= sixMonthsAgo;
      }
      if (recentFilter === "year") {
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        return paid >= twelveMonthsAgo;
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

      if (recentFilter in monthMap) {
        return paid.getMonth() === monthMap[recentFilter];
      }

      if (!term) return true;

      const name = entry.employee?.name?.toLowerCase() || "";
      const remark = (entry.remark || "").toLowerCase();

      return (
        name.includes(term) ||
        String(entry.amount).includes(term) ||
        remark.includes(term) ||
        paid.toLocaleDateString("en-IN").toLowerCase().includes(term)
      );
    });
  }, [salaryHistoryEntries, recentSearch, recentFilter]);

  const groupedSalaryHistoryEntries = useMemo(() => {
    const groups = new Map<string, typeof filteredSalaryHistoryEntries[number][]>();

    filteredSalaryHistoryEntries.forEach((entry) => {
      const key = entry.employee?.name || entry.employee_id;
      const existing = groups.get(key) || [];
      existing.push(entry);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).map(([name, entries]) => ({
      name,
      entries,
    }));
  }, [filteredSalaryHistoryEntries]);

  const [otherEditingId, setOtherEditingId] = useState<string | null>(null);
  const [otherSearch, setOtherSearch] = useState("");
  const [otherMonth, setOtherMonth] = useState("all");
  const [otherFrom, setOtherFrom] = useState("");
  const [otherTo, setOtherTo] = useState("");

  const monthOptions = useMemo(() => {
    const opts: { label: string; value: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      opts.push({
        label: d.toLocaleString("en-IN", { month: "short", year: "numeric" }),
        value: `${d.getFullYear()}-${d.getMonth()}`,
      });
    }
    return opts;
  }, []);

  const FILTER_LABELS: { key: typeof recentFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "this", label: "This Month" },
    { key: "last", label: "Last Month" },
    { key: "half", label: "Half Yearly" },
    { key: "year", label: "12 Months" },
  ];

  const MONTH_FILTERS: { key: Exclude<typeof recentFilter, "all" | "this" | "last" | "half" | "year">; label: string }[] = [
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

  const filteredOtherPayments = useMemo(() => {
    const term = otherSearch.trim().toLowerCase();

    return otherPayments.filter((p) => {
      const paid = new Date(p.paid_at);

      // date range filter has priority
      if (otherFrom) {
        const from = new Date(otherFrom);
        from.setHours(0, 0, 0, 0);
        if (paid < from) return false;
      }
      if (otherTo) {
        const to = new Date(otherTo);
        to.setHours(23, 59, 59, 999);
        if (paid > to) return false;
      }

      // month filter
      if (otherMonth && otherMonth !== "all") {
        const [y, m] = otherMonth.split("-").map(Number);
        if (!(paid.getFullYear() === y && paid.getMonth() === m)) return false;
      }

      if (!term) return true;

      return (
        p.name.toLowerCase().includes(term) ||
        String(p.amount).includes(term) ||
        p.transaction_type.toLowerCase().includes(term) ||
        p.mode.toLowerCase().includes(term) ||
        (p.remark || "").toLowerCase().includes(term) ||
        new Date(p.paid_at).toLocaleDateString("en-IN").toLowerCase().includes(term)
      );
    });
  }, [otherPayments, otherSearch, otherMonth, otherFrom, otherTo]);

  const handleOtherPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtherPaymentSubmitting(true);

    try {
      if (otherEditingId) {
        updateStoredOtherPayment(otherEditingId, {
          name: otherPaymentName.trim(),
          amount: Number.parseFloat(otherPaymentAmount) || 0,
          paid_at: otherPaymentDate || new Date().toISOString(),
          transaction_type: otherPaymentType,
          mode: otherPaymentMode,
          remark: otherPaymentRemark.trim(),
        });
      } else {
        addStoredOtherPayment({
          name: otherPaymentName.trim(),
          amount: Number.parseFloat(otherPaymentAmount) || 0,
          paid_at: otherPaymentDate || new Date().toISOString(),
          transaction_type: otherPaymentType,
          mode: otherPaymentMode,
          remark: otherPaymentRemark.trim(),
        });
      }

      setOtherPaymentName("");
      setOtherPaymentAmount("");
      setOtherPaymentDate("");
      setOtherPaymentType("");
      setOtherPaymentMode("");
      setOtherPaymentRemark("");
      setShowOtherPaymentForm(false);
      setOtherEditingId(null);
      setRefreshKey((value) => value + 1);
    } finally {
      setOtherPaymentSubmitting(false);
    }
  };

  const startEditOther = (payment: { id: string; name: string; amount: number; paid_at: string; transaction_type: string; mode: string; remark?: string }) => {
    setOtherEditingId(payment.id);
    setOtherPaymentName(payment.name || "");
    setOtherPaymentAmount(String(payment.amount || ""));
    setOtherPaymentDate(payment.paid_at ? payment.paid_at.slice(0, 10) : "");
    setOtherPaymentType(payment.transaction_type || "Expense");
    setOtherPaymentMode(payment.mode || "Cash");
    setOtherPaymentRemark(payment.remark || "");
    setShowOtherPaymentForm(true);
  };

  const handleDeleteOther = (id: string) => {
    if (!window.confirm("Delete this other payment?")) return;
    deleteStoredOtherPayment(id);
    setRefreshKey((v) => v + 1);
  };

  return (
    <AdminShell
      title="Payment / Salary Record"
      description="Manage employee salary records and payments"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Salary & payment overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review employee records and update salary details quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#1A73E8] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
            >
              <Plus size={18} />
              Add Employee
            </button>
            <button
              onClick={() => setShowSalaryModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#0F9D58] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600"
            >
              <IndianRupee size={18} />
              Salary Update
            </button>
            <button
              onClick={() => setShowOtherPaymentForm((value) => !value)}
              className="flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-600"
            >
              <Plus size={18} />
              Other Payment
            </button>
          </div>
        </div>

        {showOtherPaymentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Add Other Payment</h3>
                <button type="button" onClick={() => setShowOtherPaymentForm(false)} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
              </div>

              <form onSubmit={handleOtherPaymentSubmit} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
                    <input value={otherPaymentName} onChange={(e) => setOtherPaymentName(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Enter name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Amt</label>
                    <input type="number" min="1" value={otherPaymentAmount} onChange={(e) => setOtherPaymentAmount(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Enter amount" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Date</label>
                    <input type="date" value={otherPaymentDate} onChange={(e) => setOtherPaymentDate(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Type Of Trnx</label>
                    <input
                      type="text"
                      value={otherPaymentType}
                      onChange={(e) => setOtherPaymentType(e.target.value)}
                      placeholder="e.g. Expense, Income, Adjustment"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Mode</label>
                    <input
                      type="text"
                      value={otherPaymentMode}
                      onChange={(e) => setOtherPaymentMode(e.target.value)}
                      placeholder="e.g. Cash, Bank, UPI, Cheque"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Remark</label>
                    <input value={otherPaymentRemark} onChange={(e) => setOtherPaymentRemark(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Enter remark" />
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowOtherPaymentForm(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={otherPaymentSubmitting} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                    {otherPaymentSubmitting ? "Saving..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRecentPaymentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Recent payment history</h3>
                  <p className="mt-1 text-sm text-slate-600">Review recent salary payments with name, amount, and date.</p>
                </div>
                <button type="button" onClick={() => setShowRecentPaymentsModal(false)} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecentViewMode((value) => (value === "summary" ? "history" : "summary"))}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${recentViewMode === "summary" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  <span className="flex items-center gap-2">
                    <History size={15} />
                    {recentViewMode === "summary" ? "History" : "Summary"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecentFilter((value) => !value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${showRecentFilter ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  <span className="flex items-center gap-2">
                    <Filter size={15} />
                    Filter
                  </span>
                </button>
              </div>

              {showRecentFilter && (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:gap-3">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {FILTER_LABELS.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setRecentFilter(filter.key)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${recentFilter === filter.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <select
                      value={recentFilter}
                      onChange={(e) => setRecentFilter(e.target.value as typeof recentFilter)}
                      className="min-w-40 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none"
                    >
                      <option value="all">All months</option>
                      {MONTH_FILTERS.map((month) => (
                        <option key={month.key} value={month.key}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={recentSearch}
                      onChange={(e) => setRecentSearch(e.target.value)}
                      placeholder="Search name or note"
                      className="min-w-50 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
                {recentViewMode === "summary" ? (
                  filteredSalaryHistoryEntries.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">No salary payment found for the selected filters.</div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredSalaryHistoryEntries.map((entry) => (
                        <div key={entry.id} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm sm:grid-cols-[1.5fr_1fr_1fr_2fr] sm:items-center">
                          <div>
                            <p className="font-medium text-slate-800">{entry.employee?.name || entry.employee_id}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{new Date(entry.paid_at).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">₹{entry.amount.toLocaleString("en-IN")}</p>
                          </div>
                          <div className="truncate text-slate-600">
                            {entry.remark || "Salary payment"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : groupedSalaryHistoryEntries.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">No salary history available.</div>
                ) : (
                  <div className="space-y-3 p-3">
                    {groupedSalaryHistoryEntries.map(({ name, entries }) => (
                      <div key={name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-slate-800">{name}</h4>
                          <span className="text-xs text-slate-500">{entries.length} payments</span>
                        </div>
                        <div className="space-y-2">
                          {entries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium text-slate-700">{entry.remark || "Salary payment"}</p>
                                <p className="text-xs text-slate-500">{new Date(entry.paid_at).toLocaleDateString("en-IN")}</p>
                              </div>
                              <div className="font-semibold text-slate-900">₹{entry.amount.toLocaleString("en-IN")}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Existing Employees</span>
          </div>
          <button
            onClick={() => setShowRecentPaymentsModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#0F766E] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
          >
            <History size={16} />
            Recent Payment
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {employeesData.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={() => {
                  setEditingEmployee({
                    id: employee.id,
                    emp_id: employee.emp_id,
                    name: employee.name,
                    email: employee.email,
                    mobile: employee.mobile,
                    address: employee.address,
                    aadhaar: employee.aadhaar,
                    pan: employee.pan,
                    job_role: employee.role,
                    department: employee.department,
                    salary: employee.salaryValue,
                    photo_url: employee.avatar,
                  });
                  setShowEditModal(true);
                }}
                onViewDetails={() =>
                  setSelectedEmployee({
                    ...employee,
                    emp_id: employee.emp_id,
                  })
                }
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Other Payment List</h3>
            <div className="flex items-center gap-2">
              <select
                value={otherMonth}
                onChange={(e) => setOtherMonth(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none"
              >
                <option value="all">All months</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input type="date" value={otherFrom} onChange={(e) => setOtherFrom(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700" />
              <input type="date" value={otherTo} onChange={(e) => setOtherTo(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700" />
              <input
                value={otherSearch}
                onChange={(e) => setOtherSearch(e.target.value)}
                placeholder="Search name, amt, type, mode, remark"
                className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOtherPaymentForm(true)}
                className="rounded-lg bg-[#7C3AED] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-600"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtherSearch("");
                  setOtherMonth("all");
                  setOtherFrom("");
                  setOtherTo("");
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
              <span className="text-xs text-slate-500">{filteredOtherPayments.length} entries</span>
            </div>
          </div>
          <div className="max-h-[50vh] overflow-x-auto overflow-y-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Amt</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Mode</th>
                  <th className="px-3 py-2">Remark</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOtherPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-500">No other payments found.</td>
                  </tr>
                ) : (
                  filteredOtherPayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{payment.name}</td>
                      <td className="px-3 py-2 text-slate-700">₹{payment.amount.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-slate-700">{new Date(payment.paid_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-2 text-slate-700">{payment.transaction_type}</td>
                      <td className="px-3 py-2 text-slate-700">{payment.mode}</td>
                      <td className="px-3 py-2 text-slate-700">{payment.remark || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEditOther(payment)} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Edit</button>
                          <button type="button" onClick={() => handleDeleteOther(payment.id)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-4 sm:flex-row">
          

          <div className="flex items-center gap-1">
           
            
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            await refreshSalaryPageData();
            setRefreshKey((value) => value + 1);
            setShowAddModal(false);
          }}
        />
      )}

      {showSalaryModal && (
        <SalaryUpdateModal
          employees={employeesData.map((employee) => ({
            id: employee.id,
            emp_id: employee.emp_id,
            name: employee.name,
            job_role: employee.role,
            department: employee.department,
            salary: Number.parseInt(employee.salary.replace(/[^\d]/g, ""), 10) || 0,
            photo_url: employee.avatar,
          }))}
          onClose={() => setShowSalaryModal(false)}
          onSuccess={() => {
            setRefreshKey((value) => value + 1);
            setShowSalaryModal(false);
          }}
        />
      )}

      {showEditModal && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setRefreshKey((value) => value + 1);
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {selectedEmployee && (
        <ViewDetailsModal
          employee={{
            id: selectedEmployee.id,
            emp_id: selectedEmployee.emp_id,
            name: selectedEmployee.name,
            job_role: selectedEmployee.role,
            department: selectedEmployee.department,
            salary: Number.parseInt(selectedEmployee.salary.replace(/[^\d]/g, ""), 10) || 0,
            photo_url: selectedEmployee.avatar,
          }}
          onClose={() => setSelectedEmployee(null)}
          onSalaryUpdate={() => {
            setRefreshKey((value) => value + 1);
            setSelectedEmployee(null);
          }}
        />
      )}
    </AdminShell>
  );
}

function EmployeeCard({
  employee,
  onEdit,
  onViewDetails,
}: {
  employee: {
    id: string;
    emp_id?: string;
    name: string;
    role: string;
    department?: string;
    salary: string;
    avatar: string;
    currentMonthAmount: string;
  };
  onEdit: () => void;
  onViewDetails: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <button
        onClick={onEdit}
        className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border border-blue-200 bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md transition hover:bg-blue-700"
        type="button"
        aria-label="Edit employee"
      >
        <Pencil size={12} />
        
      </button>

      <div className="absolute inset-x-0 top-0 z-0 h-12 rounded-t-xl bg-linear-to-b from-slate-50 to-white" />

      <div className="relative z-10 mb-2 mt-1">
        <Image
          src={employee.avatar}
          alt={employee.name}
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover ring-3 ring-white shadow-sm"
        />
      </div>

      <h3 className="text-sm font-semibold text-slate-900">{employee.name}</h3>
      <p className="mb-2 text-[11px] text-slate-500">{employee.role}</p>

      <div className="mb-3 w-full px-1 text-[11px] text-slate-600">
        <div className="flex items-center justify-center gap-1.5">
          <BadgeCheck size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">
            Emp ID: {employee.emp_id || employee.id}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col items-center border-t border-slate-100 pt-2.5">
        <div className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
          <div className="text-left">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Salary
            </div>
            <div className="text-sm font-semibold text-slate-800">{employee.salary}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Current Month
            </div>
            <div className="text-sm font-semibold text-emerald-600">{employee.currentMonthAmount}</div>
          </div>
        </div>

        <button
          onClick={onViewDetails}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 py-1.5 text-[11px] font-semibold text-blue-600 shadow-sm transition hover:bg-blue-100/80"
        >
          <Eye size={14} />
          View Details
        </button>
      </div>
    </div>
  );
}