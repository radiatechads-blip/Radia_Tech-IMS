"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  stockRemark?: string;
  category?: { name: string } | null;
}

function AdminStockPageContent() {
  const router = useRouter();
  const [initialProductId, setInitialProductId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setInitialProductId(query.get("productId") ?? "");
  }, []);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [stock, setStock] = useState(0);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedProduct = useMemo(() => products.find((product) => product.id === selectedProductId), [products, selectedProductId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("/api/products?admin=true");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load products.");
        }

        if (!cancelled) {
          const list = Array.isArray(data) ? (data as Product[]) : [];
          setProducts(list);
          if (initialProductId && list.some((product) => product.id === initialProductId)) {
            setSelectedProductId(initialProductId);
          } else if (list.length > 0 && !initialProductId) {
            setSelectedProductId(list[0].id);
          }
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [initialProductId, router]);

  useEffect(() => {
    if (selectedProduct) {
      setStock(selectedProduct.stock);
      setRemark(selectedProduct.stockRemark || "");
    }
  }, [selectedProduct]);

  const handleUpdateStock = async () => {
    if (!selectedProductId) {
      setError("Please select a product first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/products/${selectedProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock, stockRemark: remark }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update stock.");
      }

      setProducts((current) => current.map((product) => product.id === selectedProductId ? { ...product, stock, stockRemark: remark } : product));
      setSuccessMessage("Stock updated successfully.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell
      title="Stock Update"
      description="Select a product, enter the updated stock quantity, and add a remark for the stock change."
      action={
        <button onClick={() => router.push("/admin/products")} className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Back to Products
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Direct Stock Update</h2>

          {fetching ? (
            <div className="h-40 animate-pulse rounded bg-slate-100" />
          ) : error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : products.length === 0 ? (
            <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">No products available yet. Add products first from the Products section.</div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Product *</span>
                  <select
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value)}
                    className="admin-input w-full"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Updated Stock *</span>
                  <input
                    type="number"
                    min="0"
                    value={stock === 0 ? "" : stock}
                    onChange={(event) => {
                      const val = event.target.value;
                      setStock(val === "" ? 0 : Number.parseInt(val, 10));
                    }}
                    className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Remark</span>
                <textarea
                  rows={4}
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  className="admin-input w-full min-h-28 resize-none"
                  placeholder="Enter a stock update reason or note"
                />
              </label>

              {selectedProduct && (
                <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="mb-2 font-semibold text-slate-900">Selected product</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>SKU: {selectedProduct.sku}</div>
                    <div>Current stock: {selectedProduct.stock}</div>
                    <div>Category: {selectedProduct.category?.name || "Uncategorized"}</div>
                    <div>Previous remark: {selectedProduct.stockRemark || "None"}</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleUpdateStock}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update Stock"}
                </button>
                {successMessage && <span className="text-sm font-medium text-emerald-700">{successMessage}</span>}
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

export default function AdminStockPage() {
  return (
    <Suspense fallback={<div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading stock update…</div>}>
      <AdminStockPageContent />
    </Suspense>
  );
}
