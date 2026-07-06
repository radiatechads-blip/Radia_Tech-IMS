"use client";

import AdminShell from "@/components/admin/AdminShell";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
  _count?: { products: number };
}

const emptyForm = { name: "", description: "" };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const auth = await fetch("/api/auth/me");
        if (auth.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const res = await fetch("/api/categories");
        const data = (await res.json().catch(() => null)) as Category[] | { error?: unknown } | null;
        if (cancelled) return;

        if (!res.ok) {
          setCategories([]);
          setError(typeof data && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to load categories.");
          return;
        }

        setCategories(Array.isArray(data) ? data : []);
        setError("");
      } catch {
        if (!cancelled) {
          setCategories([]);
          setError("Unable to load categories.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, router]);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const sanitizeSlug = (raw: string) =>
    raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const slug = sanitizeSlug(form.name);
    const url = editId ? `/api/categories/${editId}` : "/api/categories";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, slug }) });

    if (res.ok) {
      resetForm();
      setLoading(true);
      setRefreshKey((current) => current + 1);
      return;
    }

    const data = await res.json();
    alert(data.error || "Failed to save category");
  };

  const handleEdit = (category: Category) => {
    setEditId(category.id);
    setForm({ name: category.name, description: category.description });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in it will also be deleted.")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories((current) => current.filter((category) => category.id !== id));
  };

  return (
    <AdminShell
      title="Categories"
      description="Organize product families and control how catalogue groups appear on the website."
      action={
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="inline-flex w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto">
          <Plus size={16} /> Add Category
        </button>
      }
    >
      {showForm && (
        <section className="mb-6 border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{editId ? "Edit Category" : "New Category"}</h2>
              <p className="text-sm text-slate-500">Keep names short and descriptions useful for catalogue browsing.</p>
            </div>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-700" aria-label="Close category form"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
              <textarea required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-none border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </div>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <button type="submit" className="bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">{editId ? "Update Category" : "Create Category"}</button>
              <button type="button" onClick={resetForm} className="border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse border border-slate-200 bg-white" />)}
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
      ) : categories.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-5 py-16 text-center text-sm text-slate-500">No categories yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-950">{category.name}</h2>
                  <p className="mt-1 text-xs font-medium text-slate-400">/{category.slug}</p>
                </div>
                <span className="bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Order {category.sortOrder}</span>
              </div>
              <p className="line-clamp-3 min-h-15 text-sm text-slate-600">{category.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">{category._count?.products ?? 0} products</span>
                <div className="flex gap-3">
                  <button onClick={() => handleEdit(category)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"><Edit3 size={15} /> Edit</button>
                  <button onClick={() => handleDelete(category.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"><Trash2 size={15} /> Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}