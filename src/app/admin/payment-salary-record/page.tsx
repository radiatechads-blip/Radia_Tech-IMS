"use client";

import AddEmployeeModal from "@/components/admin/AddEmployeeModal";
import AdminShell from "@/components/admin/AdminShell";
import EditEmployeeModal from "@/components/admin/EditEmployeeModal";
import SalaryUpdateModal from "@/components/admin/SalaryUpdateModal";
import ViewDetailsModal from "@/components/admin/ViewDetailsModal";
import { addStoredOtherPayment, deleteStoredOtherPayment, getStoredEmployees, getStoredOtherPayments, getStoredSalaryRecords, updateStoredOtherPayment } from "@/lib/localEmployeeStorage";
import {
    BadgeCheck,
    Eye,
    IndianRupee,
    Pencil,
    Plus,
    Users
} from "lucide-react";
import { useMemo, useState } from "react";

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

  const otherPayments = useMemo(() => getStoredOtherPayments(), [refreshKey]);
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
      const label = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
      opts.push({ label, value: `${d.getFullYear()}-${d.getMonth()}` });
    }
    return opts;
  }, []);

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
      setOtherPaymentType("Expense");
      setOtherPaymentMode("Cash");
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

        

        <div className="flex items-center gap-2 pt-2 text-lg font-semibold text-slate-800">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Existing Employees</span>
        </div>

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
          <div className="overflow-hidden rounded-lg border border-slate-200">
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
          onSuccess={() => {
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
        <img
          src={employee.avatar}
          alt={employee.name}
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