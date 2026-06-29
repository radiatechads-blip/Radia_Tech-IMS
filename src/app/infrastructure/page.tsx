import ServiceSpecializationsSection from "@/components/ServiceSpecializationsSection";
import { getPublicServiceSpecializations } from "@/lib/publicSpecializations";

export const metadata = {
  title: "Specialisations - Radiatech Electra",
  description: "Explore our service specialisations and the capabilities behind every fire safety project.",
};

export const dynamic = "force-dynamic";

export default async function InfrastructurePage() {
  const specializations = await getPublicServiceSpecializations();

  return (
    <main className="bg-white">
      <section className="bg-red-700 py-18">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6">Our Specialisations</h1>
          <p className="text-red-100 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
Delivering advanced fire protection and safety solutions to protect lives, property, and business continuity.
          </p>
        </div>
      </section>

      <ServiceSpecializationsSection items={specializations} />
    </main>
  );
}
