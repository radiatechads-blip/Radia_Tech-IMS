"use client";

import AdminShell from "@/components/admin/AdminShell";
import Pagination from "@/components/admin/Pagination";
import { Edit3, Filter, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Product {
  id: string;
  slug: string;
  name: string;
  image: string;
  price?: number | null;
  hsn?: string | null;
  stock?: number | null;
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

interface InvoiceTransaction {
  id: string;
  billType: string;
  invoiceNumber: string;
  partyName: string;
  invoiceDate: string;
  qty: number;
  rate: number;
  status?: string;
}

type ProductsResponse = {
  items: Product[];
  pagination: PaginationState;
};

const pageSize = 10;

async function fetchProductsPage(page: number, categorySlug: string, search: string = ""): Promise<ProductsResponse> {
  const params = new URLSearchParams({ admin: "true", page: String(page), pageSize: String(pageSize) });
  if (categorySlug) params.set("category", categorySlug);
  if (search) params.set("search", search);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize, total: 0, totalPages: 1 });
  
  // Transaction modal state
  const [transactionModal, setTransactionModal] = useState<{ productId: string; productName: string } | null>(null);
  const [transactions, setTransactions] = useState<InvoiceTransaction[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(false);

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

        const data = await fetchProductsPage(page, categoryFilter, searchQuery);
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
  }, [page, categoryFilter, searchQuery, router]);

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

  const openTransactionModal = async (productId: string, productName: string) => {
    setTransactionModal({ productId, productName });
    setTransactionLoading(true);
    try {
      console.log("[Client] Opening transaction modal for product:", { productId, productName });
      const response = await fetch(`/api/products/${productId}/transactions?name=${encodeURIComponent(productName)}`);
      console.log("[Client] API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("[Client] Transactions received:", data);
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        const errorMsg = `${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`;
        console.error("[Client] API Error:", errorMsg);
        alert(`Error fetching transactions: ${errorMsg}`);
        setTransactions([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Client] Fetch error:", errorMsg);
      alert(`Error: ${errorMsg}`);
      setTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  const closeTransactionModal = () => {
    setTransactionModal(null);
    setTransactions([]);
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

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="admin-input flex-1"
        />
        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setPage(1);
          }}
          className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
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
                    {typeof product.price === "number" ? <p className="mt-1 text-sm font-semibold text-accent">₹{Number(product.price).toLocaleString("en-IN")}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span><span className="font-medium">HSN:</span> {product.hsn || "-"}</span>
                      <span><span className="font-medium">Stock:</span> {typeof product.stock === "number" ? product.stock : 0}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill active={product.isActive} label="Active" />
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
                  <button 
                    onClick={() => openTransactionModal(product.id, product.name)}
                    className="inline-flex flex-1 min-w-27.5 items-center justify-center gap-2 border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    📊 Transaction
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
                  <th className="px-5 py-3 font-semibold">HSN</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
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
                    <td className="px-5 py-4 font-semibold text-accent">{typeof product.price === "number" ? `₹${Number(product.price).toLocaleString("en-IN")}` : "-"}</td>
                    <td className="px-5 py-4 text-slate-600">{product.hsn || "-"}</td>
                    <td className="px-5 py-4 text-slate-700">{typeof product.stock === "number" ? product.stock : 0}</td>
                    <td className="px-5 py-4"><StatusPill active={product.isActive} label="Active" /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/products/${product.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"><Edit3 size={15} /> Edit</Link>
                        <button onClick={() => handleDelete(product.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"><Trash2 size={15} /> Delete</button>
                        <button onClick={() => router.push(`/admin/stock?productId=${product.id}`)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900">Stock</button>
                        <button 
                          onClick={() => openTransactionModal(product.id, product.name)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          📊 Transaction
                        </button>
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

      {/* Transaction Modal */}
      {transactionModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Product Transactions</h2>
                <p className="mt-1 text-sm text-slate-600">{transactionModal.productName}</p>
              </div>
              <button
                onClick={closeTransactionModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {transactionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-slate-500">Loading transactions...</div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  <p className="font-medium">No transactions found for this product</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Bill Type</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Bill No.</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Customer Name</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Quantity</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Price/Unit</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                              {txn.billType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{txn.invoiceNumber}</td>
                          <td className="px-4 py-3 text-slate-700">{txn.partyName}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {new Date(txn.invoiceDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">{txn.qty}</td>
                          <td className="px-4 py-3 text-right font-semibold text-accent">
                            ₹{txn.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                              txn.status === 'paid' || txn.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {txn.status || 'Unpaid'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={closeTransactionModal}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AdminShell>
  );
}
