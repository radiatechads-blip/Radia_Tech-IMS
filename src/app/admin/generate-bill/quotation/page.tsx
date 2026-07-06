"use client";

import AdminShell from "@/components/admin/AdminShell";
import { companyInfo } from "@/data/company";
import { useEffect, useMemo, useState } from "react";

interface ProductOption {
  id: string;
  name: string;
  unit: string;
  pricePerMeter: string;
}

interface ProductApiResponse {
  id: string;
  name: string;
  unit?: string;
  pricePerMeter?: string;
}

interface QuotationItem {
  id: number;
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  mrp: number;
  netRate: number;
  amount: number;
}

const today = new Date().toISOString().slice(0, 10);
const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function QuotationPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [quotationNumber] = useState(() => `QTN-${Date.now().toString().slice(-6)}`);
  const [customerName, setCustomerName] = useState("Client Name");
  const [customerCompany, setCustomerCompany] = useState("Client Company");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [quotationDate, setQuotationDate] = useState(today);
  const [validUntil, setValidUntil] = useState(dueDate);
  const [notes, setNotes] = useState("Please confirm the quotation and share your preferred delivery schedule.");
  const [terms, setTerms] = useState("Prices are subject to change after the validity period. Delivery and installation charges are extra unless mentioned otherwise.");

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products?admin=true");
        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();
        const productList = Array.isArray(data) ? data : data?.items ?? [];

        if (!ignore) {
          const normalizedProducts = productList.map((product: ProductApiResponse) => ({
            id: product.id,
            name: product.name,
            unit: product.unit ?? "PCS",
            pricePerMeter: product.pricePerMeter ?? "0",
          }));

          setProducts(normalizedProducts);
          setSelectedProductId((current) => current || normalizedProducts[0]?.id || "");
        }
      } catch {
        if (!ignore) {
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

  const getNumericInputValue = (value: number) => (value === 0 ? "" : value);

  const addSelectedProduct = () => {
    const selectedProduct = products.find((product) => product.id === selectedProductId);
    if (!selectedProduct) return;

    const mrp = Number.parseFloat(selectedProduct.pricePerMeter) || 0;

    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        qty: 1,
        unit: selectedProduct.unit,
        mrp,
        netRate: mrp,
        amount: mrp,
      },
    ]);
  };

  const updateItem = (id: number, key: keyof QuotationItem, value: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        if (key === "productName" || key === "unit") {
          return { ...item, [key]: value };
        }

        const numericValue = Number(value);
        const nextValue = Number.isFinite(numericValue) ? numericValue : 0;

        const updatedItem = { ...item, [key]: nextValue } as QuotationItem;
        if (key === "qty" || key === "netRate") {
          updatedItem.amount = updatedItem.qty * updatedItem.netRate;
        }

        return updatedItem;
      })
    );
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminShell
      title="Quotation"
      description="Create quotations with product selection, quantity, unit, MRP, net rate, and amount details."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Print Quotation
          </button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Quotation Builder</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Quotation Form</h2>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Quotation No.</div>
              <div>{quotationNumber}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Customer Name</span>
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="admin-input w-full" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Company / Organization</span>
              <input value={customerCompany} onChange={(event) => setCustomerCompany(event.target.value)} className="admin-input w-full" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Phone</span>
              <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="admin-input w-full" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className="admin-input w-full" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
              <textarea value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} rows={3} className="admin-input w-full" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Quotation Date</span>
              <input type="date" value={quotationDate} onChange={(event) => setQuotationDate(event.target.value)} className="admin-input w-full" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Valid Until</span>
              <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="admin-input w-full" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Notes</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="admin-input w-full" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Terms & Conditions</span>
              <textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={3} className="admin-input w-full" />
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Select Product</span>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="admin-input w-full"
                disabled={loadingProducts}
              >
                {products.length === 0 && !loadingProducts ? (
                  <option value="">No products available</option>
                ) : (
                  products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              onClick={addSelectedProduct}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              Add Selected Product
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950">Quotation Items</h3>
              <span className="text-sm text-slate-500">SR • Name of Product • QTY • UNIT • MRP • NET RATE • AMOUNT</span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Select a product and add it to the quotation to begin building the list.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 lg:block">
                  <div className="grid gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 lg:grid-cols-[0.3fr_1.1fr_0.5fr_0.5fr_0.6fr_0.6fr_0.6fr_auto]">
                    <div>SR</div>
                    <div>Name of Product</div>
                    <div>QTY</div>
                    <div>UNIT</div>
                    <div>MRP</div>
                    <div>NET RATE</div>
                    <div>AMOUNT</div>
                    <div></div>
                  </div>
                </div>

                {items.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[0.3fr_1.1fr_0.5fr_0.5fr_0.6fr_0.6fr_0.6fr_auto]">
                    <div className="flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                      {index + 1}
                    </div>
                    <input
                      value={item.productName}
                      onChange={(event) => updateItem(item.id, "productName", event.target.value)}
                      placeholder="Name of product"
                      className="admin-input w-full"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={getNumericInputValue(item.qty)}
                      onChange={(event) => updateItem(item.id, "qty", event.target.value)}
                      className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <input
                      value={item.unit}
                      onChange={(event) => updateItem(item.id, "unit", event.target.value)}
                      placeholder="UNIT"
                      className="admin-input w-full"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={getNumericInputValue(item.mrp)}
                      onChange={(event) => updateItem(item.id, "mrp", event.target.value)}
                      className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={getNumericInputValue(item.netRate)}
                      onChange={(event) => updateItem(item.id, "netRate", event.target.value)}
                      className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <input
                      type="number"
                      min="0"
                      value={getNumericInputValue(item.amount)}
                      readOnly
                      className="admin-input w-full bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
            <h3 className="text-lg font-semibold text-slate-950">Quotation Summary</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span>Total Items</span>
                  <span className="font-semibold text-slate-950">{items.length}</span>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <span>Net Amount</span>
                  <span className="font-semibold text-emerald-700">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="quotation-preview-shell print-quotation-only mx-auto w-full max-w-225 rounded-3xl border border-slate-200 bg-white p-0 shadow-sm print:border-0 print:shadow-none">
              <div className="border-b border-slate-200 bg-slate-50 p-6 print:p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img
                      src="/LOGO.png"
                      alt="Radiatech Electra logo"
                      className="h-14 w-14 rounded-md object-contain"
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-600">Quotation</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">RADIATECH ELECTRA</h3>
                      <p className="mt-2 text-sm text-slate-600">Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301</p>
                      <p className="text-sm text-slate-600">Phone: +91 81788 50959</p>
                      <p className="text-sm text-slate-600">Email: sales@radiatech.in</p>
                      <p className="text-sm text-slate-600">GSTIN: 09DDZPK0004H1ZF</p>
                      <p className="text-sm text-slate-600">State: 09-Uttar Pradesh</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <div className="font-semibold text-slate-900">Quotation No.</div>
                    <div>{quotationNumber}</div>
                    <div className="mt-2 font-semibold text-slate-900">Date</div>
                    <div>{quotationDate}</div>
                    <div className="mt-2 font-semibold text-slate-900">Valid Until</div>
                    <div>{validUntil}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-6 print:p-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bill To</p>
                  <div className="mt-2 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">{customerName || "Client Name"}</div>
                    <div>{customerCompany || "Client Company"}</div>
                    <div>{customerAddress || "Address"}</div>
                    <div>{customerPhone || "Phone"}</div>
                    <div>{customerEmail || "Email"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quotation Details</p>
                  <div className="mt-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Prepared By</span>
                      <span className="font-semibold text-slate-900">{companyInfo.ceo}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Subject</span>
                      <span className="font-semibold text-slate-900">Fire Safety Products</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 print:px-4 print:pb-4">
                <div className="overflow-hidden rounded-xl border border-slate-200 print:rounded-none">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-slate-100 text-left text-slate-700">
                      <tr>
                        <th className="border border-slate-200 px-3 py-3 font-semibold">#</th>
                        <th className="border border-slate-200 px-3 py-3 font-semibold">Product</th>
                        <th className="border border-slate-200 px-3 py-3 font-semibold">Qty</th>
                        <th className="border border-slate-200 px-3 py-3 font-semibold">Unit</th>
                        <th className="border border-slate-200 px-3 py-3 font-semibold text-right">MRP</th>
                        <th className="border border-slate-200 px-3 py-3 font-semibold text-right">Net Rate</th>
                        <th className="border border-slate-200 px-3 py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-slate-700">
                      {items.length > 0 ? (
                        items.map((item, index) => (
                          <tr key={item.id}>
                            <td className="border border-slate-200 px-3 py-3">{index + 1}</td>
                            <td className="border border-slate-200 px-3 py-3">{item.productName || "Product"}</td>
                            <td className="border border-slate-200 px-3 py-3">{item.qty}</td>
                            <td className="border border-slate-200 px-3 py-3">{item.unit}</td>
                            <td className="border border-slate-200 px-3 py-3 text-right">₹{item.mrp.toLocaleString("en-IN")}</td>
                            <td className="border border-slate-200 px-3 py-3 text-right">₹{item.netRate.toLocaleString("en-IN")}</td>
                            <td className="border border-slate-200 px-3 py-3 text-right font-semibold text-slate-900">₹{item.amount.toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="border border-slate-200 px-3 py-6 text-center text-slate-500">
                            Add products to view the quotation table here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 print:p-3">
                    <div className="font-semibold text-slate-900">Notes</div>
                    <div className="mt-2">{notes}</div>
                    <div className="mt-4 font-semibold text-slate-900">Terms & Conditions</div>
                    <div className="mt-2">{terms}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 print:p-3">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                      <span>Total</span>
                      <span>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <style jsx global>{`
              @media print {
                body {
                  background: white !important;
                  color: #0f172a !important;
                }
                body * {
                  visibility: hidden !important;
                }
                .print-quotation-only,
                .print-quotation-only * {
                  visibility: visible !important;
                }
                .print-quotation-only {
                  position: absolute !important;
                  inset: 0 !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: 1px solid #cbd5e1 !important;
                  border-radius: 0 !important;
                }
                .admin-shell {
                  padding: 0 !important;
                }
                .quotation-preview-shell {
                  box-shadow: none !important;
                  border: 1px solid #cbd5e1 !important;
                  border-radius: 0 !important;
                  padding: 0 !important;
                  max-width: none !important;
                  width: 100% !important;
                }
                table {
                  font-size: 12px !important;
                }
                th, td {
                  padding-top: 6px !important;
                  padding-bottom: 6px !important;
                }
              }
            `}</style>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
