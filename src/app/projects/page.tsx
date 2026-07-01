import type { Metadata } from "next";
import { getPublicProjectImages } from "@/lib/publicGalleries";
import ExpandableGallery from "@/components/ExpandableGallery";

export const metadata: Metadata = {
  title: "Projects - Radiatech Electra",
  description: "Explore our completed fire safety and industrial piping projects across India.",
};

export default async function ProjectsPage() {
  const projectImages = await getPublicProjectImages();

  return (
    <main className="bg-white">
      <section className="bg-red-700 py-16 lg:py-5">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-red-100">
            Our Portfolio
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Projects That Reflect Our Expertise
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-red-100">
            From industrial piping installations to fire protection systems, our work spans critical projects across diverse sectors.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Featured Project Work</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Browse a selection of completed installations and project delivery highlights from our team.
            </p>
          </div>

          <ExpandableGallery images={projectImages} initialLimit={8} lightbox />
        </div>
      </section>
    </main>
  );
}
