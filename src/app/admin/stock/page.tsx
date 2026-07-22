"use client";

import AdminShell from "@/components/admin/AdminShell";
import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  stockRemark?: string;
  category?: { name: string } | null;
}

interface StockSummaryItem {
  productId: string;
  productName: string;
  soldStock: number;
  totalAmount: number;
}

interface StockTransactionItem {
  id: string;
  invoiceDate: string | null;
  invoiceNumber: string;
  partyName: string;
  qty: number;
  rate: number;
  billType?: string;
}

function AdminStockPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [stock, setStock] = useState(0);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [stockSummary, setStockSummary] = useState<StockSummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedSummaryProductId, setSelectedSummaryProductId] = useState<string | null>(null);
  const [showDirectUpdateForm, setShowDirectUpdateForm] = useState(false);
  const [showBulkUpdateForm, setShowBulkUpdateForm] = useState(false);
  const [bulkStock, setBulkStock] = useState(0);
  const [bulkRemark, setBulkRemark] = useState("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [selectedSummaryTransactions, setSelectedSummaryTransactions] = useState<StockTransactionItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

          const targetProductId = initialProductId && list.some((product) => product.id === initialProductId)
            ? initialProductId
            : list[0]?.id || "";

          if (targetProductId) {
            const nextProduct = list.find((product) => product.id === targetProductId);
            setSelectedProductId(targetProductId);
            if (nextProduct) {
              setStock(nextProduct.stock);
              setRemark(nextProduct.stockRemark || "");
            }
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
    if (products.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadStockSummary() {
      setSummaryLoading(true);
      try {
        const summaries = await Promise.all(
          products.map(async (product) => {
            const response = await fetch(`/api/products/${product.id}/transactions?name=${encodeURIComponent(product.name)}`);
            if (!response.ok) {
              return { productId: product.id, productName: product.name, soldStock: 0, totalAmount: 0 };
            }

            const data = await response.json();
            const transactions = Array.isArray(data) ? data : [];
            const soldStock = transactions.reduce((total, item) => total + Number(item.qty || 0), 0);
            const totalAmount = transactions.reduce((total, item) => total + Number(item.qty || 0) * Number(item.rate || 0), 0);

            return { productId: product.id, productName: product.name, soldStock, totalAmount };
          }),
        );

        if (!cancelled) setStockSummary(summaries);
      } catch {
        if (!cancelled) setStockSummary([]);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }

    void loadStockSummary();
    return () => { cancelled = true; };
  }, [products]);

  const filteredStockSummary = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return stockSummary;

    return stockSummary.filter((item) => item.productName.toLowerCase().includes(query));
  }, [searchQuery, stockSummary]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
  };

  const handleTrackProduct = async (productId: string, productName: string) => {
    if (selectedSummaryProductId === productId) {
      setSelectedSummaryProductId(null);
      setSelectedSummaryTransactions([]);
      return;
    }

    setSelectedSummaryProductId(productId);
    setDetailLoading(true);
    setSelectedSummaryTransactions([]);

    try {
      const response = await fetch(`/api/products/${productId}/transactions?name=${encodeURIComponent(productName)}`);
      if (!response.ok) {
        setSelectedSummaryTransactions([]);
        return;
      }

      const data = await response.json();
      setSelectedSummaryTransactions(Array.isArray(data) ? (data as StockTransactionItem[]) : []);
    } catch {
      setSelectedSummaryTransactions([]);
    } finally {
      setDetailLoading(false);
    }
  };

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

  const handleBulkUpdateStock = async () => {
    if (bulkSelectedIds.length === 0) {
      setError("Please select at least one product to update.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const updates = await Promise.all(
        bulkSelectedIds.map(async (productId) => {
          const response = await fetch(`/api/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stock: bulkStock, stockRemark: bulkRemark }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || `Unable to update ${productId}.`);
          }
          return productId;
        }),
      );

      setProducts((current) => current.map((product) => (updates.includes(product.id) ? { ...product, stock: bulkStock, stockRemark: bulkRemark } : product)));
      setBulkSelectedIds([]);
      setBulkStock(0);
      setBulkRemark("");
      setShowBulkUpdateForm(false);
      setSuccessMessage(`Stock updated for ${updates.length} product${updates.length === 1 ? "" : "s"}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update stock in bulk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell
      title="Stock Update"
      description="Select a product, enter the updated stock quantity, and add a remark for the stock change."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDirectUpdateForm((value) => !value)}
            className="inline-flex items-center justify-center rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {showDirectUpdateForm ? "Hide Update Form" : "Stock Update"}
          </button>
          <button
            type="button"
            onClick={() => setShowBulkUpdateForm((value) => !value)}
            className="inline-flex items-center justify-center rounded border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20"
          >
            {showBulkUpdateForm ? "Hide Bulk Update" : "Bulk Update"}
          </button>
          <button onClick={() => router.push("/admin/products")} className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Back to Products
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Stock Status</h2>
              <p className="mt-1 text-sm text-slate-500">Product-wise sold stock and total amount overview.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search product name"
                className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          {summaryLoading ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : filteredStockSummary.length === 0 ? (
            <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {searchQuery ? "No products match your search." : "No stock summary available yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-600">
                    <th className="px-3 py-2 font-semibold">Product Name</th>
                    <th className="px-3 py-2 font-semibold">Current Stock</th>
                    <th className="px-3 py-2 font-semibold">Solded Stock</th>
                    <th className="px-3 py-2 font-semibold">Total Amount</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStockSummary.map((item) => (
                    <Fragment key={item.productId}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{item.productName}</td>
                        <td className="px-3 py-2 text-slate-700">{products.find((product) => product.id === item.productId)?.stock ?? 0}</td>
                        <td className="px-3 py-2 text-slate-700">{item.soldStock}</td>
                        <td className="px-3 py-2 text-slate-700">{formatCurrency(item.totalAmount)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => void handleTrackProduct(item.productId, item.productName)}
                            className="rounded border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20"
                          >
                            {selectedSummaryProductId === item.productId ? "Tracking" : "Track"}
                          </button>
                        </td>
                      </tr>
                      {selectedSummaryProductId === item.productId ? (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 px-3 py-3">
                            <div className="rounded border border-slate-200 bg-white p-3">
                              <div className="mb-2 text-sm font-semibold text-slate-900">Stock Summary</div>
                              {detailLoading ? (
                                <div className="h-20 animate-pulse rounded bg-slate-100" />
                              ) : selectedSummaryTransactions.length === 0 ? (
                                <div className="text-sm text-slate-500">No transaction history found for this product.</div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-slate-200 text-left text-slate-600">
                                        <th className="px-2 py-2 font-semibold">Date</th>
                                        <th className="px-2 py-2 font-semibold">Stock/Qty</th>
                                        <th className="px-2 py-2 font-semibold">Bill No</th>
                                        <th className="px-2 py-2 font-semibold">Customer</th>
                                        <th className="px-2 py-2 font-semibold">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedSummaryTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="border-b border-slate-100 last:border-0">
                                          <td className="px-2 py-2 text-slate-700">{formatDate(transaction.invoiceDate)}</td>
                                          <td className="px-2 py-2 text-slate-700">{transaction.qty}</td>
                                          <td className="px-2 py-2 text-slate-700">{getDuplicateCopyInvoiceNumber(transaction.invoiceNumber, false) || "-"}</td>
                                          <td className="px-2 py-2 text-slate-700">{transaction.partyName || "-"}</td>
                                          <td className="px-2 py-2 text-slate-700">{formatCurrency(transaction.qty * transaction.rate)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-slate-200 bg-white p-6 shadow-sm">
          {showDirectUpdateForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Direct Stock Update</h3>
                    <p className="mt-1 text-sm text-slate-500">Update product stock directly from this popup.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDirectUpdateForm(false)}
                    className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

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
                          onChange={(event) => {
                            const nextProductId = event.target.value;
                            setSelectedProductId(nextProductId);

                            const nextProduct = products.find((product) => product.id === nextProductId);
                            if (nextProduct) {
                              setStock(nextProduct.stock);
                              setRemark(nextProduct.stockRemark || "");
                            }
                          }}
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
              </div>
            </div>
          )}
        </section>

        {showBulkUpdateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Bulk Stock Update</h3>
                  <p className="mt-1 text-sm text-slate-500">Update stock for up to 20 products at once.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkUpdateForm(false)}
                  className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Updated Stock *</span>
                    <input
                      type="number"
                      min="0"
                      value={bulkStock === 0 ? "" : bulkStock}
                      onChange={(event) => {
                        const val = event.target.value;
                        setBulkStock(val === "" ? 0 : Number.parseInt(val, 10));
                      }}
                      className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Remark</span>
                    <textarea
                      rows={3}
                      value={bulkRemark}
                      onChange={(event) => setBulkRemark(event.target.value)}
                      className="admin-input w-full min-h-24 resize-none"
                      placeholder="Enter a common remark for all selected products"
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-900">Select products (max 20)</div>
                  <div className="max-h-72 overflow-auto rounded border border-slate-200 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {products.map((product) => {
                        const isSelected = bulkSelectedIds.includes(product.id);
                        return (
                          <label key={product.id} className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={bulkSelectedIds.length >= 20 && !isSelected}
                              onChange={() => {
                                setBulkSelectedIds((current) => {
                                  if (current.includes(product.id)) {
                                    return current.filter((id) => id !== product.id);
                                  }
                                  if (current.length >= 20) {
                                    return current;
                                  }
                                  return [...current, product.id];
                                });
                              }}
                            />
                            <span>{product.name} ({product.sku})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Selected: {bulkSelectedIds.length}/20</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleBulkUpdateStock}
                    disabled={loading || bulkSelectedIds.length === 0}
                    className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    {loading ? "Updating..." : `Update ${bulkSelectedIds.length} Product${bulkSelectedIds.length === 1 ? "" : "s"}`}
                  </button>
                  {successMessage && <span className="text-sm font-medium text-emerald-700">{successMessage}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
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
