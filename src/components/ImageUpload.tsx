"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  folder: "products" | "categories" | "blogs" | "projects" | "infrastructure";
  onImageSelect: (url: string) => void;
  currentImage?: string;
  label?: string;
  onUploadStateChange?: (uploading: boolean) => void;
}

export default function ImageUpload({
  folder,
  onImageSelect,
  currentImage,
  label = "Upload Image",
  onUploadStateChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewOverride, setPreviewOverride] = useState<string | null | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = previewOverride === undefined ? currentImage : previewOverride || undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    onUploadStateChange?.(true);

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewOverride(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      onImageSelect(url);
      setPreviewOverride(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreviewOverride(undefined);
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewOverride(null);
    onImageSelect("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {preview ? (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <Image
              src={preview}
              alt="Preview"
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              unoptimized={preview.startsWith("data:")}
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Change Image"}
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Upload className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {uploading ? "Uploading..." : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, WebP, GIF (max 5MB)</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
