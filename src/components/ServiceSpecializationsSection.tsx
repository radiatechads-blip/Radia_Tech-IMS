"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X, ArrowLeft } from "lucide-react";
import type { PublicServiceSpecialization } from "@/lib/publicSpecializations";

export default function ServiceSpecializationsSection({ items }: { items: PublicServiceSpecialization[] }) {
  const [selectedItem, setSelectedItem] = useState<PublicServiceSpecialization | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedItem) {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedItem]);

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Specialisations</h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            Explore the specialist fire safety services we deliver across industry and infrastructure.
          </p>
        </div>

        {selectedItem ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="mb-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={16} /> Back to all specialisations
            </button>

            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div className="relative h-96 overflow-hidden rounded-3xl bg-slate-100">
                {selectedItem.image ? (
                  <Image
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">No image</div>
                )}
              </div>

              <div>
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-600">Specialisation</p>
                  <h3 className="mt-2 text-4xl font-bold text-slate-950">{selectedItem.title}</h3>
                </div>
                <div className="whitespace-pre-line text-base leading-8 text-slate-600">
                  {selectedItem.fullDescription}
                </div>
              </div>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            No specialisations have been added yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <article key={item.id} className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-200 text-sm text-slate-500">No image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{item.shortDescription}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700"
                  >
                    Learn more <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}
