"use client";

import { deleteStoredEmployee, updateStoredEmployee, type EmployeeRecord } from "@/lib/localEmployeeStorage";
import { UserCog, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface EmployeeFormValues {
  emp_id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  aadhaar: string;
  pan: string;
  job_role: string;
  salary: string;
}

interface Props {
  employee: EmployeeRecord | null;
  onClose: () => void;
  onSuccess: (employee: EmployeeFormValues) => void;
}

const emptyForm: EmployeeFormValues = {
  emp_id: "",
  name: "",
  email: "",
  mobile: "",
  address: "",
  aadhaar: "",
  pan: "",
  job_role: "",
  salary: "",
};

export default function EditEmployeeModal({ employee, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<EmployeeFormValues>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!employee) {
      setForm(emptyForm);
      return;
    }

    setForm({
      emp_id: employee.emp_id,
      name: employee.name,
      email: employee.email || "",
      mobile: employee.mobile || "",
      address: employee.address || "",
      aadhaar: employee.aadhaar || "",
      pan: employee.pan || "",
      job_role: employee.job_role || "",
      salary: String(employee.salary ?? ""),
    });
  }, [employee]);

  const setField = (key: keyof EmployeeFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async () => {
    if (!employee) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const deleted = deleteStoredEmployee(employee.id);
      if (!deleted) {
        throw new Error("Employee could not be deleted.");
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to delete employee.");
      return;
    }

    setLoading(false);
    onSuccess(form);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      updateStoredEmployee(employee.id, {
        emp_id: form.emp_id.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
        aadhaar: form.aadhaar.trim(),
        pan: form.pan.trim(),
        job_role: form.job_role.trim(),
        salary: Number.parseFloat(form.salary) || 0,
        photo_url: employee.photo_url || "",
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to update employee.");
      return;
    }

    setLoading(false);
    onSuccess(form);
    onClose();
  };

  const fields: Array<{ key: keyof EmployeeFormValues; label: string; placeholder: string; type?: string }> = [
    { key: "emp_id", label: "Employee ID", placeholder: "e.g. EMP009" },
    { key: "name", label: "Full Name", placeholder: "Employee full name" },
    { key: "email", label: "Email ID", placeholder: "employee@example.com", type: "email" },
    { key: "mobile", label: "Mobile No.", placeholder: "10-digit mobile number", type: "tel" },
    { key: "address", label: "Address", placeholder: "Full address" },
    { key: "aadhaar", label: "Aadhaar Card No.", placeholder: "XXXX-XXXX-XXXX" },
    { key: "pan", label: "PAN Card No.", placeholder: "ABCDE1234F" },
    { key: "job_role", label: "Job Role", placeholder: "e.g. Software Engineer" },
    { key: "salary", label: "Monthly Salary (₹)", placeholder: "0", type: "number" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <UserCog size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Employee</h2>
              <p className="text-xs text-gray-500">Update the employee details below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            type="button"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ key, label, placeholder, type }) => (
              <div key={key} className={key === "address" ? "col-span-2" : ""}>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>
                <input
                  type={type || "text"}
                  required
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              type="button"
              className="rounded-lg border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
