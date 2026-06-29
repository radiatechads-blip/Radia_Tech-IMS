import type { Metadata } from "next";
import Image from "next/image";
import { Award, BadgeCheck, Clock3, Flame, ShieldCheck, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "Why Us - Radiatech Electra",
  description: "Discover what makes Extinct Fire Engineers a trusted name in fire protection solutions across India.",
};

const reasons = [
  {
    icon: Award,
    title: "Unmatched Quality",
    description:
      "As one of the best fire protection service providers in India, we bring deep industry knowledge and uncompromising standards to every project.",
  },
  {
    icon: ShieldCheck,
    title: "Safety Focused",
    description:
      "We have built strong safety systems and processes that minimize unsafe activity and keep projects moving without compromise.",
  },
  {
    icon: Flame,
    title: "Dedicated Fire Protection Experts",
    description:
      "With more than three decades in the fire protection industry, we have strong relationships across the sector and a proven workflow.",
  },
  {
    icon: Clock3,
    title: "Fast Decision Making",
    description:
      "Our flat organizational structure allows us to make swift decisions and avoid unnecessary delays in execution.",
  },
  {
    icon: Workflow,
    title: "Target Completion",
    description:
      "Our team remains actively involved throughout the project lifecycle to ensure timely completion and minimal disruption to operations.",
  },
  {
    icon: BadgeCheck,
    title: "Robust Systems and Processes",
    description:
      "Professional systems, transparent processes, and disciplined execution help us deliver projects with clarity and confidence.",
  },
];

const highlights = [
  "One of the rare companies in India not blacklisted by any client or consultant.",
  "Grade A licensed by the fire department.",
  "Presence across PAN India.",
  "High concentration on quality management systems and safety.",
  "Advanced systems, processes, and custom software for project tracking, planning, and execution.",
];

export default function WhyUsPage() {
  return (
    <main className="bg-white">
      <section className="bg-red-700 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-red-100">
            Why Choose Us
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Trusted for protection, quality, and dependable execution.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-red-100">
            Radiatech Electra is one of India’s leading fire protection companies, with a portfolio of clients across the country who trust us to protect their facilities.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 rounded-[2rem] border border-gray-100 bg-white p-8 shadow-2xl shadow-red-900/10 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">A partner built on expertise and accountability</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                At Radiatech Electra, we go beyond installation—we deliver complete Fire & Safety Solutions designed to protect lives, assets, business continuity, and critical infrastructure. Our strength lies in combining technical expertise, quality execution, innovation, and an uncompromising commitment to safety across every project we undertake.
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Our solutions are developed to deliver maximum protection, operational reliability, and long-term performance while complying with industry standards and project specifications. We focus on reducing risks, improving emergency readiness, and creating safer environments for people and assets.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-gray-50 p-3 shadow-inner">
              <Image
                src="/images/fas.jpg"
                alt="Why Us illustration"
                width={1200}
                height={800}
                className="h-full min-h-[320px] w-full rounded-[1.2rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">What sets us apart</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Our approach combines deep experience, disciplined execution, and a relentless focus on fire protection outcomes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {reasons.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="inline-flex rounded-2xl bg-red-50 p-3 text-red-600">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-br from-red-700 to-red-900 p-8 text-white shadow-2xl shadow-red-900/20 lg:p-12">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold">What’s special about Extinct Fire Engineers?</h2>
              <ul className="mt-8 space-y-4 text-lg text-red-50">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xl shadow-red-900/10 lg:flex lg:items-center lg:justify-between lg:p-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ready to secure your project with trusted fire protection expertise?</h2>
              <p className="mt-3 max-w-2xl text-lg text-gray-600">
                Let’s discuss your requirements and deliver a solution that meets safety, compliance, and performance expectations.
              </p>
            </div>
            <a
              href="/contact"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-red-600 px-7 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 lg:mt-0"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
