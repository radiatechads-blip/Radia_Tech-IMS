"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ImageUpload from "@/components/ImageUpload";

interface ServiceSpecialization {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = {
  title: "",
  shortDescription: "",
  fullDescription: "",
  image: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminSpecializationsPage() {
  const [items, setItems] = useState<ServiceSpecialization[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch("/api/service-specializations");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load specialisations.");
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load specialisations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(editingId ? `/api/service-specializations/${editingId}` : "/api/service-specializations", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to save specialisation.");

      setForm(emptyForm);
      setEditingId(null);
      void loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save specialisation.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this specialisation?")) return;

    try {
      const response = await fetch(`/api/service-specializations/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to delete specialisation.");
      setForm(emptyForm);
      setEditingId(null);
      void loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete specialisation.");
    }
  }

  function startEdit(item: ServiceSpecialization) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      image: item.image,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
  }

  return (
    <AdminShell
      title="Specialisations"
      description="Create and manage the service specialisations shown on the public page."
    >
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{editingId ? "Edit specialisation" : "Add specialisation"}</h2>
              <p className="mt-1 text-sm text-slate-500">The card uses the short text, while the full description appears in the modal.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Plus size={15} /> New
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Fire Alarm Systems"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Short description</label>
              <textarea
                value={form.shortDescription}
                onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))}
                className="min-h-24 w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Short summary for the card"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full description</label>
              <textarea
                value={form.fullDescription}
                onChange={(event) => setForm((current) => ({ ...current, fullDescription: event.target.value }))}
                className="min-h-36 w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Detailed content shown when the visitor clicks Learn more"
                required
              />
            </div>
            <ImageUpload
              folder="infrastructure"
              label="Specialisation image"
              currentImage={form.image}
              onImageSelect={(url) => setForm((current) => ({ ...current, image: url }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Sort order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                  className="w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Visible</label>
                <select
                  value={form.isActive ? "true" : "false"}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === "true" }))}
                  className="w-full border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="true">Show on website</option>
                  <option value="false">Hide from website</option>
                </select>
              </div>
            </div>

            {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : editingId ? "Update specialisation" : "Save specialisation"}
            </button>
          </form>
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Current specialisations</h2>
            <p className="mt-1 text-sm text-slate-500">Manage the content that appears on the public page.</p>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse bg-slate-50" />
          ) : items.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No specialisations yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{item.title}</h3>
                      <span className={`inline-flex px-2.5 py-1 text-[11px] font-semibold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {item.isActive ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.shortDescription}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark"
                    >
                      <Edit3 size={15} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
