"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}


function parseJsonObject(value: unknown): Record<string, string> {
  if (typeof value !== "string")
    return typeof value === "object" && value && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, String(item)]),
        )
      : {};

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed && !Array.isArray(parsed)
      ? Object.fromEntries(
          Object.entries(parsed).map(([key, item]) => [key, String(item)]),
        )
      : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [];
  } catch {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function specificationTextFromValue(value: unknown) {
  return Object.entries(parseJsonObject(value))
    .map(([key, item]) => `${key}: ${item}`)
    .join("\n");
}

function applicationsTextFromValue(value: unknown) {
  return parseJsonArray(value).join("\n");
}

function parseSpecificationText(value: string) {
  const details: Record<string, string> = {};
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex > -1) {
        const key = line.slice(0, separatorIndex).trim();
        const item = line.slice(separatorIndex + 1).trim();
        if (key && item) details[key] = item;
        return;
      }

      details[`Detail ${index + 1}`] = line;
    });

  return details;
}

function parseApplicationsText(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminProductForm({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const isEdit = id !== "new";
  const productId = isEdit ? id : null;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    hsn: "",
    unit: "PCS",
    stock: 0,
    price: 0,
    description: "",
    specificationText: "",
    applicationsText: "",
    image: "",
    categoryId: "",
    isFeatured: false,
    isNewArrival: false,
    isActive: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const categoryResponse = await fetch("/api/categories");
        const categoryData = (await categoryResponse
          .json()
          .catch(() => null)) as Category[] | { error?: unknown } | null;
        if (!categoryResponse.ok) {
          if (!cancelled) {
            setLoadError(
              typeof categoryData &&
                categoryData &&
                "error" in categoryData &&
                typeof categoryData.error === "string"
                ? categoryData.error
                : "Unable to load categories.",
            );
          }
          return;
        }

        if (!cancelled) {
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        }

        if (isEdit && productId) {
          const response = await fetch(`/api/products/${productId}`);
          const product = (await response.json().catch(() => null)) as
            | (Record<string, unknown> & { error?: unknown })
            | null;
          if (!response.ok) {
            if (!cancelled) {
              setLoadError(
                typeof product?.error === "string"
                  ? product.error
                  : "Unable to load product.",
              );
            }
            return;
          }

          if (!cancelled && product) {
            setForm({
              name: String(product.name || ""),
              slug: String(product.slug || ""),
              sku: String(product.sku || ""),
              hsn: String(product.hsn || ""),
              unit: String(product.unit || "PCS"),
              stock: Number.isFinite(Number(product.stock))
                ? Number(product.stock)
                : 0,
              price: Number.isFinite(Number(product.price)) // Populating price on edit
                ? Number(product.price)
                : 0,
              description: String(product.description || ""),
              specificationText: specificationTextFromValue(
                product.specifications,
              ),
              applicationsText: applicationsTextFromValue(product.applications),
              image: String(product.image || ""),
              categoryId: String(product.categoryId || ""),
              isFeatured: Boolean(product.isFeatured),
              isNewArrival: Boolean(product.isNewArrival),
              isActive: Boolean(product.isActive),
            });
          }
        }

        if (!cancelled) {
          setLoadError("");
        }
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load product form.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [router, isEdit, productId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const slug =
      form.slug ||
      form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const body = {
      slug,
      name: form.name.trim(),
      sku: form.sku.trim(),
      hsn: form.hsn.trim(),
      unit: form.unit,
      stock: Number.isFinite(Number(form.stock)) ? Number(form.stock) : 0,
      price: Number.isFinite(Number(form.price)) ? Number(form.price) : 0, // Adding price to body payload
      description: form.description.trim(),
      specifications: parseSpecificationText(form.specificationText),
      applications: parseApplicationsText(form.applicationsText),
      image: form.image,
      categoryId: form.categoryId,
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival,
      isActive: form.isActive,
    };

    const url = isEdit ? `/api/products/${productId}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) router.push("/admin/products");
      else {
        const data = await response.json();
        alert(data.error || "Failed to save product");
      }
    } catch {
      alert("Error saving product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title={isEdit ? "Edit Product" : "Add Product"}
      description="Add product details, images, pricing, and catalogue visibility."
      action={
        <button
          onClick={() => router.push("/admin/products")}
          className="border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Back to Products
        </button>
      }
    >
      {loading ? (
        <div className="h-64 animate-pulse border border-slate-200 bg-white" />
      ) : loadError ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">
          {loadError}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
          <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-950">
              Product Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product Name *">
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="SKU *">
                <input
                  required
                  value={form.sku}
                  onChange={(event) =>
                    setForm({ ...form, sku: event.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="HSN">
                <input
                  value={form.hsn}
                  onChange={(event) =>
                    setForm({ ...form, hsn: event.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Category *">
                <select
                  required
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                  className="admin-input"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit *">
                <select
                  required
                  value={form.unit}
                  onChange={(event) =>
                    setForm({ ...form, unit: event.target.value })
                  }
                  className="admin-input"
                >
                  <option value="MTR">MTR</option>
                  <option value="PCS">PCS</option>
                  <option value="FEET">FEET</option>
                  <option value="KG">KG</option>
                  <option value="PKT">PKT</option>
                  <option value="LOT">LOT</option>
                  <option value="NMR">NOS</option>
                  <option value="PAIR">PAIR</option>
                  <option value="LTR">LTR</option>
                  <option value="ROLLS">ROLLS</option>
                </select>
              </Field>
              <Field label="Stock *">
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      stock: val === "" ? 0 : Number.parseInt(val, 10),
                    });
                  }}
                  className="admin-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </Field>
              {/* Added Price Field */}
              <Field label="Price *">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      price: val === "" ? 0 : Number.parseFloat(val),
                    });
                  }}
                  className="admin-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </Field>
            </div>

          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Create Product"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

