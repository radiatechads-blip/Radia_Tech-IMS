"use client";

import AdminShell from "@/components/admin/AdminShell";
import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
import { buildTaxInvoiceChartData, type InvoiceRange } from "@/lib/taxInvoiceChart";
import { DollarSign, FolderTree, Inbox, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  productName?: string;
  product?: { name: string } | null;
  createdAt: string;
  isRead: boolean;
}

interface TransactionBill {
  id: string;
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  invoiceDate: string;
  createdAt: string;
}

interface CategoryCount {
  name: string;
  products: number;
}

interface TaxInvoiceSeriesPoint {
  invoiceDate: string;
  grandTotal: number;
}

interface LowStockAlert {
  id: string;
  name: string;
  stock: number;
}

interface Stats {
  products: number;
  categories: number;
  stock: number;
  customers: number;
  totalSoldProducts: number;
  totalAmount: number;
  inquiries: { total: number; unread: number };
  recentInquiries: Inquiry[];
  recentTransactions?: TransactionBill[];
  lowStockAlerts?: LowStockAlert[];
  categoriesWithCounts?: CategoryCount[];
  taxInvoiceSeries?: TaxInvoiceSeriesPoint[];
  businessSummary?: { totalBills?: number };
}

const CHART_RANGE_OPTIONS: Array<{ value: InvoiceRange; label: string }> = [
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisQuarter", label: "This Quarter" },
  { value: "halfYear", label: "Half Year" },
  { value: "thisYear", label: "This Year" },
];

const CATEGORY_CHART_COLORS = ["#1e40af", "#0369a1", "#0891b2", "#0d9488", "#059669", "#16a34a", "#ca8a04", "#dc2626"];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartRange, setChartRange] = useState<InvoiceRange>("thisMonth");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const auth = await fetch("/api/auth/me");
        if (auth.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const res = await fetch("/api/admin/stats");
        const data = (await res.json().catch(() => null)) as Stats | { error?: unknown } | null;
        if (cancelled) return;

        if (!res.ok) {
          setStats(null);
          setError(typeof data && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to load dashboard statistics.");
          return;
        }

        setStats(data as Stats);
        setError("");
      } catch {
        if (!cancelled) {
          setStats(null);
          setError("Unable to load dashboard statistics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const totalInvoiceCount = stats?.businessSummary?.totalBills ?? stats?.recentTransactions?.length ?? 0;

  const statCards = [
    { label: "Active Products", value: stats?.products ?? 0, icon: Package, tone: "bg-blue-50 text-primary", href: "/admin/products" },
    { label: "Stock", value: stats?.stock ?? 0, icon: Package, tone: "bg-emerald-50 text-emerald-700", href: "/admin/products" },
    { label: "Customers", value: stats?.customers ?? 0, icon: Users, tone: "bg-violet-50 text-violet-700", href: "/admin/customers" },
    { label: "Categories", value: stats?.categories ?? 0, icon: FolderTree, tone: "bg-orange-50 text-accent", href: "/admin/categories" },
    { label: "Total Sold Products", value: stats?.totalSoldProducts ?? 0, icon: ShoppingCart, tone: "bg-sky-50 text-sky-700", href: "/admin/generate-bill" },
    { label: "Total Amount", value: `₹${(stats?.totalAmount ?? 0).toLocaleString("en-IN")}`, icon: DollarSign, tone: "bg-amber-50 text-amber-700", href: "/admin/generate-bill" },
    { label: "Total Bills", value: totalInvoiceCount, icon: Inbox, tone: "bg-amber-50 text-amber-700", href: "/admin/generate-bill" },
  ];

  const taxInvoiceChartData = useMemo(
    () => buildTaxInvoiceChartData(stats?.taxInvoiceSeries ?? [], chartRange),
    [chartRange, stats?.taxInvoiceSeries]
  );

  const totalTaxInvoiceAmount = useMemo(
    () => taxInvoiceChartData.reduce((sum, point) => sum + point.amount, 0),
    [taxInvoiceChartData]
  );

  const overviewChartData = useMemo(
    () => [
      { label: "Products", value: stats?.products ?? 0 },
      { label: "Stock", value: stats?.stock ?? 0 },
      { label: "Customers", value: stats?.customers ?? 0 },
      { label: "Categories", value: stats?.categories ?? 0 },
      { label: "Sold", value: stats?.totalSoldProducts ?? 0 },
      { label: "Bills", value: totalInvoiceCount },
      { label: "Amount", value: stats?.totalAmount ?? 0 },
    ],
    [stats?.categories, stats?.customers, stats?.products, stats?.stock, stats?.totalAmount, stats?.totalSoldProducts, totalInvoiceCount]
  );

  return (
    <AdminShell
      title="Dashboard"
      description="Monitor website content, product catalogue, and customer inquiries from one place."
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/admin/products/new" className="inline-flex w-full items-center justify-center bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto">
            Add Product
          </Link>
          <Link href="/admin/generate-bill/invoice" className="inline-flex w-full items-center justify-center border border-red-700 bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 sm:w-auto">
            Invoice
          </Link>
          <Link href="/admin/generate-bill/quotation" className="inline-flex w-full items-center justify-center border border-green-700 bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 sm:w-auto">
            Quotation
          </Link>
        </div>
      }
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-32 animate-pulse border border-slate-200 bg-white" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} href={card.href} className="group border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-500">{card.label}</p>
                      <p className={`mt-0.5 text-base font-bold leading-tight text-slate-950 ${String(card.value).length > 12 ? "text-[13px]" : ""}`}>{card.value}</p>
                    </div>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${card.tone}`}>
                      <Icon size={16} />
                    </span>
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:text-primary-dark">
                    Manage <TrendingUp size={12} />
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-10">
            <section className="border border-slate-200 bg-white shadow-sm lg:col-span-7">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Tax Invoice Amount</h2>
                  <p className="text-sm text-slate-500">Total amount of tax invoices across the selected period.</p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Total: ₹{totalTaxInvoiceAmount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="tax-chart-range" className="text-sm font-medium text-slate-600">
                    Filter
                  </label>
                  <select
                    id="tax-chart-range"
                    value={chartRange}
                    onChange={(event) => setChartRange(event.target.value as InvoiceRange)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm outline-none focus:border-primary"
                  >
                    {CHART_RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-2 py-5">
                {taxInvoiceChartData.some((point) => point.amount > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={taxInvoiceChartData} margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`}
                        contentStyle={{ fontSize: 12, borderRadius: 0, border: "1px solid #e2e8f0" }}
                      />
                      <Line type="monotone" dataKey="amount" name="Tax Invoice Amount" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-65 items-center justify-center text-sm text-slate-400">No tax invoice data yet for this period.</div>
                )}
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm lg:col-span-3">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Low Stock Alerts</h2>
                <p className="text-sm text-slate-500">Products with stock below 50 units.</p>
              </div>
              <div className="max-h-80 overflow-y-auto px-3 py-4">
                {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
                  <ul className="space-y-2">
                    {stats.lowStockAlerts.map((item) => (
                      <li key={item.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        <span className="ml-3 shrink-0 rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-amber-700">{item.stock}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                    No products are below the low stock threshold.
                  </div>
                )}
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm lg:col-span-3">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Category Overview</h2>
                <p className="text-sm text-slate-500">Distribution of products across categories.</p>
              </div>
              <div className="flex flex-col items-center px-2 py-5">
                {stats?.categoriesWithCounts && stats.categoriesWithCounts.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={stats.categoriesWithCounts}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="products"
                        >
                          {stats.categoriesWithCounts.map((_, index) => (
                            <Cell key={`pie-${index}`} fill={CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 0, border: "1px solid #e2e8f0" }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="mt-1 text-sm text-slate-500">
                      <span className="font-semibold text-slate-950">{stats.categoriesWithCounts.length}</span> categories
                    </p>
                  </>
                ) : (
                  <div className="flex h-60 items-center justify-center text-sm text-slate-400">No category data yet.</div>
                )}
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm lg:col-span-7">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Overview Graph</h2>
                <p className="text-sm text-slate-500">Summary of dashboard card data</p>
              </div>
              <div className="px-2 py-5">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={overviewChartData} margin={{ top: 8, right: 8, left: -10, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
                      formatter={(value) => [value, "Value"]}
                      contentStyle={{ fontSize: 12, borderRadius: 0, border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Recent Transaction Bills</h2>
                <p className="text-sm text-slate-500">Latest generated invoice bills from the Generate Bill section.</p>
              </div>
              <Link href="/admin/generate-bill" className="text-sm font-semibold text-primary hover:text-primary-dark">View all</Link>
            </div>

            {stats?.recentTransactions?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-180 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Invoice No.</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentTransactions?.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-950">{getDuplicateCopyInvoiceNumber(transaction.invoiceNumber, false)}</td>
                        <td className="px-5 py-4 text-slate-600">{transaction.partyName || "-"}</td>
                        <td className="px-5 py-4 text-slate-500">{new Date(transaction.invoiceDate || transaction.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-5 py-4 font-semibold text-slate-950">₹{Number(transaction.grandTotal || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No generated bills yet.</div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}