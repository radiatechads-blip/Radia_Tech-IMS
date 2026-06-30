"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ImageUpload from "@/components/ImageUpload";
import MultiImageUpload from "@/components/MultiImageUpload";
import RichTextEditor from "@/components/admin/RichTextEditor";

function tagsTextFromValue(value: unknown) {
  if (Array.isArray(value)) return value.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).join(", ");
  if (typeof value !== "string") return "";

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).join(", ") : value;
  } catch {
    return value;
  }
}

function parseTagsText(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function plainTextFromHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function parseImages(value: unknown, coverImage = "") {
  if (Array.isArray(value)) return value.filter((image): image is string => typeof image === "string" && image.length > 0);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((image): image is string => typeof image === "string" && image.length > 0);
    } catch {
      return coverImage ? [coverImage] : [];
    }
  }
  return coverImage ? [coverImage] : [];
}

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateInputFromValue(value: unknown) {
  if (!value) return todayInputDate();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? todayInputDate() : date.toISOString().slice(0, 10);
}

function publishedIsoFromInput(value: string) {
  return new Date(`${value || todayInputDate()}T12:00:00.000Z`).toISOString();
}

export default function AdminBlogForm({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    images: [] as string[],
    author: "R Singh",
    tagsText: "",
    isPublished: false,
    publishedDate: todayInputDate(),
  });

  useEffect(() => {
    let cancelled = false;
    params.then(async ({ id }) => {
      try {
        const auth = await fetch("/api/auth/me");
        if (auth.status === 401) {
          router.replace("/admin/login");
          return;
        }

        if (id !== "new") {
          setIsEdit(true);
          setBlogId(id);
          const response = await fetch(`/api/blogs/${id}`);
          const blog = (await response.json().catch(() => null)) as Record<string, unknown> & { error?: unknown } | null;
          if (!response.ok) {
            if (!cancelled) {
              setLoadError(typeof blog?.error === "string" ? blog.error : "Unable to load blog post.");
            }
            return;
          }

          if (!cancelled && blog) {
            setForm({
              title: String(blog.title || ""),
              slug: String(blog.slug || ""),
              excerpt: String(blog.excerpt || ""),
              content: String(blog.content || ""),
              coverImage: String(blog.coverImage || ""),
              images: parseImages(blog.images, String(blog.coverImage || "")),
              author: String(blog.author || "R Singh"),
              tagsText: tagsTextFromValue(blog.tags),
              isPublished: Boolean(blog.isPublished),
              publishedDate: dateInputFromValue(blog.publishedAt || blog.createdAt),
            });
          }
        }

        if (!cancelled) {
          setLoadError("");
        }
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load blog post.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => { cancelled = true; };
  }, [params, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!plainTextFromHtml(form.content)) {
      alert("Content is required");
      return;
    }

    setSaving(true);
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const body = {
      slug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      coverImage: form.coverImage,
      images: form.images.length > 0 ? form.images : form.coverImage ? [form.coverImage] : [],
      author: form.author.trim() || "R Singh",
      tags: parseTagsText(form.tagsText),
      isPublished: form.isPublished,
      publishedAt: form.isPublished ? publishedIsoFromInput(form.publishedDate) : null,
    };
    const url = isEdit ? `/api/blogs/${blogId}` : "/api/blogs";
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.ok) router.push("/admin/blogs");
      else {
        const data = await response.json();
        alert(data.error || "Failed to save post");
      }
    } catch {
      alert("Error saving post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title={isEdit ? "Edit Blog Post" : "New Blog Post"}
      description="Create articles with formatted headings, lists, images, and publishing status."
      action={<button onClick={() => router.push("/admin/blogs")} className="border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Back to Blogs</button>}
    >
      {loading ? (
        <div className="h-64 animate-pulse border border-slate-200 bg-white" />
      ) : loadError ? (
        <div className="border border-red-200 bg-red-50 px-5 py-6 text-sm font-medium text-red-700">{loadError}</div>
      ) : (
      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Post Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="admin-input" /></Field>
            <Field label="Author"><input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="admin-input" /></Field>
          </div>
          <Field label="Excerpt *" className="mt-4"><textarea required rows={3} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className="admin-input resize-none" /></Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ImageUpload folder="blogs" currentImage={form.coverImage} onImageSelect={(url) => setForm({ ...form, coverImage: url, images: form.images.length > 0 ? form.images : url ? [url] : [] })} label="Cover Image" />
            <div className="space-y-4">
              <Field label="Tags"><input value={form.tagsText} onChange={(event) => setForm({ ...form, tagsText: event.target.value })} placeholder="Fire , Industrial, Guide" className="admin-input" /></Field>
              <Field label="Publish Date"><input type="date" value={form.publishedDate} onChange={(event) => setForm({ ...form, publishedDate: event.target.value })} className="admin-input" /></Field>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="h-4 w-4 border-slate-300 text-primary" />
                Published
              </label>
            </div>
          </div>
          <div className="mt-5">
            <MultiImageUpload folder="blogs" currentImages={form.images} onImagesSelect={(urls) => setForm({ ...form, images: urls, coverImage: form.coverImage || urls[0] || "" })} label="Blog Gallery Images" />
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Content</h2>
          <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        </section>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={saving} className="bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {saving ? "Saving..." : isEdit ? "Update Post" : "Create Post"}
          </button>
          <button type="button" onClick={() => router.push("/admin/blogs")} className="border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
      )}
    </AdminShell>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
