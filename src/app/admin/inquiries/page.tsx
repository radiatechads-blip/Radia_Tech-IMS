"use client";

import AdminShell from "@/components/admin/AdminShell";
import {
  BarChart3,
  CalendarDays,
  DollarSign,
  FileText,
  Gauge,
  Package,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Period = "day" | "month" | "year";

type TransactionBill = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  grandTotal: number;
  invoiceDate: string;
  createdAt: string;
};

type TrendPoint = {
  label: string;
  revenue: number;
  bills: number;
  soldProducts: number;
};

type Stats = {
  products: number;
  categories: number;
  stock: number;
  customers: number;
  totalSoldProducts: number;
  totalAmount: number;
  recentTransactions?: TransactionBill[];
  categoriesWithCounts?: Array<{ name: string; products: number }>;
  businessSummary?: {
    period: Period;
    trend: TrendPoint[];
    totalRevenue: number;
    totalBills: number;
    avgBillValue: number;
    totalSoldProducts: number;
  };
};

const periods: Array<{ value: Period; label: string }> = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

// Palette shared by the new pie/donut chart so each category gets a distinct,
// consistent color between the chart and its legend.
const CATEGORY_COLORS = [
  "#2563eb",
  "#0f766e",
  "#f59e0b",
  "#ef4444",
  "#7c3aed",
  "#db2777",
  "#14b8a6",
  "#f97316",
  "#0ea5e9",
  "#84cc16",
];

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function BusinessInsightPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("month");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const auth = await fetch("/api/auth/me");
        if (auth.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch(`/api/admin/stats?period=${period}`);
        const data = (await response.json().catch(() => null)) as Stats | { error?: unknown } | null;
        if (cancelled) return;

        if (!response.ok) {
          setStats(null);
          setError(typeof data && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to load business insight data.");
          return;
        }

        setStats(data as Stats);
        setError("");
      } catch {
        if (!cancelled) {
          setStats(null);
          setError("Unable to load business insight data.");
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
  }, [period, router]);

  const summary = useMemo(() => ({
    revenue: stats?.businessSummary?.totalRevenue ?? stats?.totalAmount ?? 0,
    bills: stats?.businessSummary?.totalBills ?? stats?.recentTransactions?.length ?? 0,
    avgBill: stats?.businessSummary?.avgBillValue ?? 0,
    soldProducts: stats?.businessSummary?.totalSoldProducts ?? stats?.totalSoldProducts ?? 0,
    products: stats?.products ?? 0,
    categories: stats?.categories ?? 0,
    stock: stats?.stock ?? 0,
    customers: stats?.customers ?? 0,
    categoriesWithCounts: stats?.categoriesWithCounts ?? [],
  }), [stats]);

  const trendData = stats?.businessSummary?.trend ?? [];

  // ---- Everything below is DERIVED from the same fetched `stats`/`summary`/
  // `trendData` above — no new API calls, no change to the loading logic —
  // just reshaping existing numbers for a few additional chart types. ----

  const categoryPieData = useMemo(
    () => summary.categoriesWithCounts.map((category) => ({ name: category.name, value: category.products })),
    [summary.categoriesWithCounts]
  );

  const catalogRadarData = useMemo(() => {
    const maxMetric = Math.max(summary.products, summary.categories, summary.stock, summary.customers, 1);
    return [
      { metric: "Products", value: Math.round((summary.products / maxMetric) * 100), actual: summary.products },
      { metric: "Categories", value: Math.round((summary.categories / maxMetric) * 100), actual: summary.categories },
      { metric: "Stock", value: Math.round((summary.stock / maxMetric) * 100), actual: summary.stock },
      { metric: "Customers", value: Math.round((summary.customers / maxMetric) * 100), actual: summary.customers },
    ];
  }, [summary.products, summary.categories, summary.stock, summary.customers]);

  const avgOrderValueTrend = useMemo(
    () =>
      trendData.map((point) => ({
        label: point.label,
        avgOrderValue: point.bills > 0 ? point.revenue / point.bills : 0,
      })),
    [trendData]
  );

  const cumulativeRevenueTrend = useMemo(() => {
    let running = 0;
    return trendData.map((point) => {
      running += point.revenue;
      return { label: point.label, cumulativeRevenue: running };
    });
  }, [trendData]);

  const sellThroughRate = useMemo(() => {
    const totalUnits = summary.stock + summary.soldProducts;
    return totalUnits > 0 ? Math.round((summary.soldProducts / totalUnits) * 100) : 0;
  }, [summary.stock, summary.soldProducts]);

  const sellThroughGaugeData = useMemo(
    () => [{ name: "Sell-through", value: sellThroughRate, fill: "#0f766e" }],
    [sellThroughRate]
  );

  return (
    <AdminShell
      title="Business Insight"
      description="Track business growth with quick summaries, period-based filters, and clear sales charts."
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse border border-slate-200 bg-white" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-80 animate-pulse border border-slate-200 bg-white" />
            <div className="h-80 animate-pulse border border-slate-200 bg-white" />
          </div>
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Business growth view</p>
              <p className="mt-1 text-sm text-slate-500">Switch between day, month, and year views to understand sales momentum quickly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {periods.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPeriod(item.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${period === item.value ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"}`}
                >
                  <CalendarDays size={15} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Revenue" value={formatCurrency(summary.revenue)} detail="Total billed amount" icon={DollarSign} tone="bg-emerald-50 text-emerald-700" />
            <MetricCard title="Bills" value={summary.bills.toString()} detail="Generated invoices" icon={FileText} tone="bg-blue-50 text-primary" />
            <MetricCard title="Avg. Bill" value={formatCurrency(summary.avgBill)} detail="Per invoice value" icon={BarChart3} tone="bg-amber-50 text-amber-700" />
            <MetricCard title="Sold Items" value={summary.soldProducts.toString()} detail="Products sold" icon={Package} tone="bg-violet-50 text-violet-700" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Business snapshot</h2>
                <p className="mt-1 text-sm text-slate-500">A quick look at your active inventory and customer base.</p>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <MiniStatCard label="Active products" value={summary.products.toString()} detail="Live product catalog" />
                <MiniStatCard label="Categories" value={summary.categories.toString()} detail="Product groups" />
                <MiniStatCard label="Stock units" value={summary.stock.toString()} detail="Available inventory" />
                <MiniStatCard label="Customers" value={summary.customers.toString()} detail="Registered buyers" />
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Top categories</h2>
                <p className="mt-1 text-sm text-slate-500">See which categories are driving your product mix.</p>
              </div>
              <div className="space-y-4 p-5">
                {summary.categoriesWithCounts.length ? (
                  summary.categoriesWithCounts.map((category) => (
                    <div key={category.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{category.name}</span>
                        <span className="text-slate-500">{category.products} products</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(12, category.products * 10))}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No category data available yet.</p>
                )}
              </div>
            </section>
          </div>

          {/* ===== NEW: Category distribution donut chart (same categoriesWithCounts data, new view) ===== */}
          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <PieChartIcon size={18} className="text-fuchsia-600" />
                <h2 className="text-lg font-semibold text-slate-950">Category distribution</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">The same category breakdown above, visualized as a share of your total catalog.</p>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.2fr] md:items-center">
              <div className="h-72">
                {categoryPieData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | string) => `${value} products`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No category data available yet.</div>
                )}
              </div>
              <div className="space-y-2">
                {categoryPieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                      {entry.name}
                    </span>
                    <span className="text-slate-500">{entry.value} products</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-950">Revenue growth trend</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">See how your business is growing across the selected period.</p>
              </div>
              <div className="h-80 px-3 py-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="bills" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <h2 className="text-lg font-semibold text-slate-950">Sales snapshot</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Product units sold over the same period.</p>
              </div>
              <div className="h-80 px-3 py-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip formatter={(value: number | string) => `${value} units`} />
                    <Bar dataKey="soldProducts" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* ===== NEW: Average order value + cumulative revenue, both derived from the same trendData ===== */}
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-sky-600" />
                  <h2 className="text-lg font-semibold text-slate-950">Average order value trend</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Revenue per bill across the selected period — a read on ticket size, not just volume.</p>
              </div>
              <div className="h-72 px-3 py-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={avgOrderValueTrend}>
                    <defs>
                      <linearGradient id="avgOrderValueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="avgOrderValue" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#avgOrderValueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-950">Cumulative revenue</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Running total of revenue built up across the selected period.</p>
              </div>
              <div className="h-72 px-3 py-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeRevenueTrend}>
                    <defs>
                      <linearGradient id="cumulativeRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="cumulativeRevenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#cumulativeRevenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <h2 className="text-lg font-semibold text-slate-950">Revenue vs bill activity</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">Compare revenue growth with the number of bills generated over the same period.</p>
            </div>
            <div className="h-80 px-3 py-5">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip formatter={(value: number | string, name: string) => name === "revenue" ? formatCurrency(Number(value)) : `${value} bills`} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bills" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Bills" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ===== NEW: Catalog composition radar + sell-through radial gauge, both derived from summary ===== */}
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <RadarIcon size={18} className="text-teal-600" />
                  <h2 className="text-lg font-semibold text-slate-950">Catalog composition</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Products, categories, stock, and customers scaled relative to one another.</p>
              </div>
              <div className="h-80 px-3 py-5">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={catalogRadarData} outerRadius="75%">
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Radar name="Relative scale" dataKey="value" stroke="#0f766e" fill="#0f766e" fillOpacity={0.35} />
                    <Tooltip
                      formatter={(value: number | string, _name: string, item) => {
                        const actual = item?.payload?.actual;
                        return actual !== undefined ? `${actual} (${value}% of max)` : `${value}%`;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Gauge size={18} className="text-rose-600" />
                  <h2 className="text-lg font-semibold text-slate-950">Sell-through rate</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Share of total units (sold + in stock) that have already been sold.</p>
              </div>
              <div className="relative h-80 px-3 py-5">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={sellThroughGaugeData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={12} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-950">{sellThroughRate}%</span>
                  <span className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Sold vs total units</span>
                </div>
              </div>
            </section>
          </div>

          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Latest transaction bills</h2>
                <p className="text-sm text-slate-500">Your recent billing activity and customer payments.</p>
              </div>
              <a href="/admin/generate-bill" className="text-sm font-semibold text-primary hover:text-primary-dark">Open bills</a>
            </div>

            {stats?.recentTransactions?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Invoice</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-950">{transaction.invoiceNumber}</td>
                        <td className="px-5 py-4 text-slate-600">{transaction.partyName || "-"}</td>
                        <td className="px-5 py-4 text-slate-500">{new Date(transaction.invoiceDate || transaction.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-5 py-4 font-semibold text-slate-950">{formatCurrency(Number(transaction.grandTotal || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No bills generated yet.</div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function MetricCard({ title, value, detail, icon: Icon, tone }: { title: string; value: string; detail: string; icon: typeof DollarSign; tone: string }) {
  return (
    <div className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function MiniStatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}