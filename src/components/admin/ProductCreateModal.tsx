"use client";

import { useEffect, useState } from "react";

interface ProductCreateModalProps {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onProductCreated: (product: {
    id: string;
    name: string;
    sku: string;
    hsn: string;
    unit: string;
    price: number;
    categoryId: string;
  }) => void;
}

interface CategoryOption {
  id: string;
  name: string;
}

const ALLOWED_UNITS = [
  "MTR",
  "PCS",
  "FEET",
  "KG",
  "PKT",
  "LOT",
  "NMR",
  "PAIR",
  "LTR",
  "ROLLS",
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductCreateModal({
  open,
  initialName = "",
  onClose,
  onProductCreated,
}: ProductCreateModalProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    name: initialName,
    sku: "",
    hsn: "",
    categoryId: "",
    unit: "PCS",
    stock: 0,
    price: 0,
  });

  useEffect(() => {
    if (!open) return;

    setForm((current) => ({
      ...current,
      name: initialName || "",
    }));
  }, [open, initialName]);

  useEffect(() => {
    if (!open) return;

    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) return;

        const data = await response.json();
        if (!Array.isArray(data)) return;

        const normalized = data
          .map((category: any) => ({
            id: String(category.id || ""),
            name: String(category.name || ""),
          }))
          .filter((category: CategoryOption) => category.id && category.name);

        setCategories(normalized);
      } catch {
        // ignore
      } finally {
        setIsLoadingCategories(false);
      }
    };

    void loadCategories();
  }, [open]);

  const resetForm = () => {
    setForm({
      name: "",
      sku: "",
      hsn: "",
      categoryId: "",
      unit: "PCS",
      stock: 0,
      price: 0,
    });
    setSubmitError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.name.trim() || !form.sku.trim() || !form.categoryId || !form.unit.trim() || !String(form.price).trim()) {
      setSubmitError("Product Name, SKU, Category, Unit, and Price are required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugify(form.name),
          name: form.name.trim(),
          sku: form.sku.trim(),
          hsn: form.hsn.trim(),
          categoryId: form.categoryId,
          unit: form.unit,
          stock: Number.isFinite(Number(form.stock)) ? Number(form.stock) : 0,
          price: Number.isFinite(Number(form.price)) ? Number(form.price) : 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to create product.");
      }

      onProductCreated({
        id: String(data.id ?? ""),
        name: String(data.name ?? form.name.trim()),
        sku: String(data.sku ?? form.sku.trim()),
        hsn: String(data.hsn ?? form.hsn.trim()),
        unit: String(data.unit ?? form.unit),
        price: Number(data.price ?? form.price),
        categoryId: String(data.categoryId ?? form.categoryId),
      });
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 print:hidden">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Add New Product</h2>
          <button type="button" onClick={handleClose} className="text-sm text-slate-500 hover:text-slate-800">
            Close
          </button>
        </div>

        {submitError && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Product Name *</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="admin-input w-full"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">SKU *</span>
            <input
              required
              value={form.sku}
              onChange={(event) => setForm({ ...form, sku: event.target.value })}
              className="admin-input w-full"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">HSN</span>
            <input
              value={form.hsn}
              onChange={(event) => setForm({ ...form, hsn: event.target.value })}
              className="admin-input w-full"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Category *</span>
            <select
              required
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              className="admin-input w-full"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Unit *</span>
            <select
              required
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
              className="admin-input w-full"
            >
              {ALLOWED_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Stock *</span>
            <input
              required
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: Number(event.target.value) || 0 })}
              className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Price *</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: Number(event.target.value) || 0 })}
              className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save Product"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
