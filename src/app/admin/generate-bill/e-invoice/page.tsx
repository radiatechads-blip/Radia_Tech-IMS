"use client";

import AdminShell from "@/components/admin/AdminShell";
import { AlertTriangle, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function EInvoicePage() {
  return (
    <AdminShell
      title="E-Invoice"
      description="Upcoming feature for GST e-invoice generation"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-amber-200 bg-amber-50/80 p-8 shadow-sm">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white/90 p-5 shadow-sm">
          <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Upcoming Feature
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              E-Invoice generation will be enabled soon.
            </h2>
            <p className="text-sm leading-6 text-slate-700">
              This feature will become available once your business turnover crosses ₹5 crore,
              as E-Invoice becomes mandatory at that stage.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText size={16} className="text-amber-600" />
            What to expect
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
            <li>• Automatic E-Invoice generation for eligible invoices.</li>
            <li>• GST-compliant upload and validation for invoice data.</li>
            <li>• Seamless integration with the billing workflow once the threshold is met.</li>
          </ul>
        </div>

        <Link
          href="/admin/generate-bill"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Generate Bill
        </Link>
      </div>
    </AdminShell>
  );
}
