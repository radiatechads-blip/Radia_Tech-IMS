"use client";

import AdminShell from "@/components/admin/AdminShell";
import Pagination from "@/components/admin/Pagination";
import { Edit3, Filter, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  slug: string;
  name: string;
  image: string;
  pricePerMeter: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  category?: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type ProductsResponse = {
  items: Product[];
  pagination: PaginationState;
};

const pageSize = 10;

async function fetchProductsPage(page: number, categorySlug: string): Promise<ProductsResponse> {
  const params = new URLSearchParams({ admin: "true", page: String(page), pageSize: String(pageSize) });
  if (categorySlug) params.set("category", categorySlug);
  const response = await fetch(`/api/products?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load products.");
  return data;
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      {active ? label : "-"}
    </span>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize, total: 0, totalPages: 1 });

  // Load categories once for filter dropdown
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data as Category[]); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const authResponse = await fetch("/api/auth/me");
        if (authResponse.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const data = await fetchProductsPage(page, categoryFilter);
        if (cancelled) return;

        setProducts(data.items || []);
        setPagination(data.pagination || { page, pageSize, total: 0, totalPages: 1 });
        setError("");
        if (data.pagination?.totalPages && page > data.pagination.totalPages) setPage(data.pagination.totalPages);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();
    return () => { cancelled = true; };
  }, [page, categoryFilter, router]);

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (!response.ok) { setLoading(false); return; }
    if (products.length === 1 && page > 1) { setPage((p) => p - 1); return; }
    setProducts((current) => current.filter((product) => product.id !== productId));
    setPagination((current) => {
      const total = Math.max(0, current.total - 1);
      return { ...current, total, totalPages: Math.max(1, Math.ceil(total / current.pageSize)) };
    });
    setLoading(false);
  };

  const handlePageChange = (nextPage: number) => { setLoading(true); setPage(nextPage); };

  const handleCategoryFilter = (slug: string) => {
    setLoading(true);
    setPage(1);
    setCategoryFilter(slug);
  };

  return (
    <AdminShell
      title="Products"
      description="Manage catalogue items, gallery images, featured products, and availability status."
      action={
        <Link href="/admin/products/new" className="inline-flex w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto">
          <Plus size={16} /> Add Product
        </Link>
      }
    >
      {/* Category filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500"><Filter size={14} /> Filter:</span>
        <button
          onClick={() => handleCategoryFilter("")}
          className={`px-3 py-1.5 text-xs font-semibold border transition ${categoryFilter === "" ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryFilter(cat.slug)}
            className={`px-3 py-1.5 text-xs font-semibold border transition ${categoryFilter === cat.slug ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse border border-slate-200 bg-white" />
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-5 py-16 text-center text-sm text-slate-500">
          {categoryFilter ? `No products in this category.` : "No products yet."}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {products.map((product) => (
              <article key={product.id} className="border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  {product.image ? <Image src={product.image} alt={product.name} width={64} height={64} unoptimized className="h-16 w-16 shrink-0 object-cover" /> : <div className="h-16 w-16 shrink-0 bg-slate-100" />}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-slate-950">{product.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{product.category?.name || "Uncategorized"}</p>
                    {product.pricePerMeter && <p className="mt-1 text-sm font-semibold text-accent">{product.pricePerMeter}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill active={product.isActive} label="Active" />
                      <StatusPill active={product.isFeatured} label="Featured" />
                      <StatusPill active={product.isNewArrival} label="New" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link href={`/admin/products/${product.id}`} className="inline-flex flex-1 min-w-27.5 items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm font-semibold text-primary hover:bg-slate-50">
                    <Edit3 size={15} /> Edit
                  </Link>
                  <button onClick={() => handleDelete(product.id)} className="inline-flex flex-1 min-w-27.5 items-center justify-center gap-2 border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                    <Trash2 size={15} /> Delete
                  </button>
                  <button onClick={() => router.push(`/admin/stock?productId=${product.id}`)} className="inline-flex flex-1 min-w-27.5 items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Stock
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-235 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Featured</th>
                  <th className="px-5 py-3 font-semibold">New</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.image ? <Image src={product.image} alt={product.name} width={44} height={44} unoptimized className="h-11 w-11 object-cover" /> : <div className="h-11 w-11 bg-slate-100" />}
                        <span className="font-medium text-slate-950">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{product.category?.name || "-"}</td>
                    <td className="px-5 py-4 font-semibold text-accent">{product.pricePerMeter || "-"}</td>
                    <td className="px-5 py-4"><StatusPill active={product.isFeatured} label="Featured" /></td>
                    <td className="px-5 py-4"><StatusPill active={product.isNewArrival} label="New" /></td>
                    <td className="px-5 py-4"><StatusPill active={product.isActive} label="Active" /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/products/${product.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"><Edit3 size={15} /> Edit</Link>
                        <button onClick={() => handleDelete(product.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"><Trash2 size={15} /> Delete</button>
                        <button onClick={() => router.push(`/admin/stock?productId=${product.id}`)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900">Stock</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={handlePageChange} />
        </>
      )}
    </AdminShell>
  );
}
