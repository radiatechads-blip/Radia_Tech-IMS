"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ImageUpload from "@/components/ImageUpload";

type GalleryEndpoint = "project-images" | "infrastructure-images";
type GalleryFolder = "projects" | "infrastructure";

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  sortOrder: number;
}

interface GalleryManagerProps {
  endpoint: GalleryEndpoint;
  uploadFolder: GalleryFolder;
  title: string;
  description: string;
  formTitle: string;
  emptyMessage: string;
}

const emptyForm = { title: "", image: "", sortOrder: 0 };

export default function GalleryManager({ endpoint, uploadFolder, title, description, formTitle, emptyMessage }: GalleryManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        const auth = await fetch("/api/auth/me");
        if (auth.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch(`/api/${endpoint}?admin=true`);
        const data = (await response.json().catch(() => null)) as GalleryItem[] | { error?: unknown } | null;
        if (cancelled) return;

        if (!response.ok) {
          setItems([]);
          setError(typeof data && data && "error" in data && typeof data.error === "string" ? data.error : "Unable to load gallery images.");
          return;
        }

        setItems(Array.isArray(data) ? data : []);
        setError("");
      } catch {
        if (!cancelled) {
          setItems([]);
          setError("Unable to load gallery images.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItems();
    return () => { cancelled = true; };
  }, [endpoint, refreshKey, router]);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setSubmitError("");
  };

  const handleEdit = (item: GalleryItem) => {
    setEditId(item.id);
    setForm({ title: item.title, image: item.image, sortOrder: item.sortOrder });
    setSubmitError("");
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.image.trim()) {
      setSubmitError("Please upload an image before saving.");
      return;
    }

    if (uploadingImage) {
      setSubmitError("Please wait for the image upload to finish.");
      return;
    }

    const url = editId ? `/api/${endpoint}/${editId}` : `/api/${endpoint}`;
    const method = editId ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title.trim(), image: form.image, sortOrder: form.sortOrder }),
    });

    if (response.ok) {
      resetForm();
      setLoading(true);
      setRefreshKey((current) => current + 1);
      return;
    }

    const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
    setSubmitError(typeof data?.error === "string" ? data.error : "Failed to save gallery image.");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gallery image?")) return;
    const response = await fetch(`/api/${endpoint}/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <AdminShell
      title={title}
      description={description}
      action={
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="inline-flex w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto">
          <Plus size={16} /> Add Image
        </button>
      }
    >
      {showForm && (
        <section className="mb-6 border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{editId ? `Edit ${formTitle}` : `New ${formTitle}`}</h2>
              <p className="text-sm text-slate-500">Lower order numbers appear first on the public website.</p>
            </div>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-700" aria-label="Close gallery form"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Title *</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="admin-input" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Sort Order</span>
                <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number.parseInt(event.target.value, 10) || 0 })} className="admin-input" />
              </label>
            </div>
            <ImageUpload folder={uploadFolder} currentImage={form.image} onImageSelect={(url) => setForm({ ...form, image: url })} onUploadStateChange={setUploadingImage} label="Image *" />
            {submitError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</div>}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <button type="submit" className="bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">{editId ? "Update Image" : "Create Image"}</button>
              <button type="button" onClick={resetForm} className="border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse border border-slate-200 bg-white" />)}
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{error}</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-5 py-16 text-center text-sm text-slate-500">{emptyMessage}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative mb-4 h-44 overflow-hidden bg-slate-100">
                {item.image && <Image src={item.image} alt={item.title} fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-cover" />}
              </div>
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="font-semibold text-slate-950">{item.title}</h2>
                <span className="shrink-0 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Order {item.sortOrder}</span>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"><Edit3 size={15} /> Edit</button>
                <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"><Trash2 size={15} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}