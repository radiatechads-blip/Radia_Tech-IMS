"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpenText, FolderTree, Inbox, Package, Sparkles, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminShell from "@/components/admin/AdminShell";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  productName?: string;
  product?: { name: string } | null;
  createdAt: string;
  isRead: boolean;
}

interface CategoryCount {
  name: string;
  products: number;
}

interface Stats {
  products: number;
  categories: number;
  blogs: number;
  specializations: number;
  inquiries: { total: number; unread: number };
  recentInquiries: Inquiry[];
  categoriesWithCounts?: CategoryCount[];
}

const CHART_COLORS = ["#1e40af", "#0369a1", "#0891b2", "#0d9488", "#059669", "#16a34a", "#ca8a04", "#dc2626"];

const PIE_COLORS = ["#059669", "#f59e0b"];

export default function AdminDashboard() {
  const router = useRouter();
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

  const statCards = [
    { label: "Active Products", value: stats?.products ?? 0, icon: Package, tone: "bg-blue-50 text-primary", href: "/admin/products" },
    { label: "Categories", value: stats?.categories ?? 0, icon: FolderTree, tone: "bg-orange-50 text-accent", href: "/admin/categories" },
    { label: "Specializations", value: stats?.specializations ?? 0, icon: Sparkles, tone: "bg-purple-50 text-purple-700", href: "/admin/specializations" },
    { label: "Blog Posts", value: stats?.blogs ?? 0, icon: BookOpenText, tone: "bg-emerald-50 text-emerald-700", href: "/admin/blogs" },
    { label: "Unread Inquiries", value: stats?.inquiries.unread ?? 0, icon: Inbox, tone: "bg-amber-50 text-amber-700", href: "/admin/inquiries" },
  ];

  return (
    <AdminShell
      title="Dashboard"
      description="Monitor website content, product catalogue, and customer inquiries from one place."
      action={
        <Link href="/admin/products/new" className="inline-flex w-full items-center justify-center bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto">
          Add Product
        </Link>
      }
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 animate-pulse border border-slate-200 bg-white" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} href={card.href} className="group border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{card.label}</p>
                      <p className="mt-2 text-3xl font-bold text-slate-950">{card.value}</p>
                    </div>
                    <span className={`flex h-12 w-12 items-center justify-center ${card.tone}`}>
                      <Icon size={22} />
                    </span>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:text-primary-dark">
                    Manage <TrendingUp size={14} />
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Products by Category bar chart — spans 3/5 */}
            <section className="lg:col-span-3 border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Products by Category</h2>
                <p className="text-sm text-slate-500">Number of products in each catalogue category.</p>
              </div>
              <div className="px-2 py-5">
                {stats?.categoriesWithCounts && stats.categoriesWithCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.categoriesWithCounts} margin={{ top: 4, right: 16, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 0, border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="products" name="Products" radius={[2, 2, 0, 0]}>
                        {stats.categoriesWithCounts.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No category data yet.</div>
                )}
              </div>
            </section>

            {/* Inquiry status pie chart — spans 2/5 */}
            <section className="lg:col-span-2 border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Inquiry Status</h2>
                <p className="text-sm text-slate-500">Breakdown of read vs. unread inquiries.</p>
              </div>
              <div className="flex flex-col items-center px-2 py-5">
                {stats && stats.inquiries.total > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Read", value: stats.inquiries.total - stats.inquiries.unread },
                            { name: "Unread", value: stats.inquiries.unread },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {PIE_COLORS.map((color, index) => (
                            <Cell key={`pie-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 0, border: "1px solid #e2e8f0" }} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="mt-1 text-sm text-slate-500">
                      <span className="font-semibold text-slate-950">{stats.inquiries.total}</span> total inquiries
                    </p>
                  </>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">No inquiry data yet.</div>
                )}
              </div>
            </section>
          </div>

          {/* Content overview bar chart */}
          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Content Overview</h2>
              <p className="text-sm text-slate-500">Total count of each content type managed in the admin.</p>
            </div>
            <div className="px-2 py-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: "Products", value: stats?.products ?? 0, fill: "#1e40af" },
                    { name: "Categories", value: stats?.categories ?? 0, fill: "#0891b2" },
                    { name: "Blog Posts", value: stats?.blogs ?? 0, fill: "#059669" },
                    { name: "Total Inquiries", value: stats?.inquiries.total ?? 0, fill: "#ca8a04" },
                  ]}
                  margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 0, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="value" name="Count" radius={[0, 2, 2, 0]}>
                    {[0, 1, 2, 3].map((index) => (
                      <Cell key={`bar-${index}`} fill={["#1e40af", "#0891b2", "#059669", "#ca8a04"][index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Recent Inquiries</h2>
                <p className="text-sm text-slate-500">Latest customer messages received through the website.</p>
              </div>
              <Link href="/admin/inquiries" className="text-sm font-semibold text-primary hover:text-primary-dark">View all</Link>
            </div>

            {stats?.recentInquiries.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Product</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentInquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-950">{inquiry.name}</td>
                        <td className="px-5 py-4 text-slate-600">{inquiry.email || "-"}</td>
                        <td className="px-5 py-4 text-slate-600">{inquiry.product?.name || inquiry.productName || "-"}</td>
                        <td className="px-5 py-4 text-slate-500">{new Date(inquiry.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${inquiry.isRead ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {inquiry.isRead ? "Read" : "New"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No inquiries yet.</div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}