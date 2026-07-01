import Link from "next/link";
import Image from "next/image";
import {
  X,
  Mail,
  ShieldCheck,
  Headset,
  CheckCircle2,
  Award,
  Droplets,
  AlarmClockCheck,
  ShieldAlert,
  Flame,
  Bell,
  DraftingCompass,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react";
import {
  Shield,
  Settings,
  Clock,
  Tag,
  Users,
  Truck,
  Calendar,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Phone,
  Factory,
  Wrench,
  Toolbox,
  ZodiacAquarius,
} from "lucide-react";
import { companyInfo } from "@/data/company";
import {
  getPublicCategories,
  getPublicFeaturedProducts,
  getPublicNewArrivals,
} from "@/lib/publicProducts";
import { getPublicServiceSpecializations } from "@/lib/publicSpecializations";
import { ReactElement } from "react";
import { getPublicProjectImages } from "@/lib/publicGalleries";
import { getRecentPublishedBlogs, parseBlogImages } from "@/lib/publicBlogs";
import ExpandableGallery from "@/components/ExpandableGallery";
import InquiryForm from "@/components/InquiryForm";
import EnquiryButton from "@/components/EnquiryButton";
import RatingSummary from "@/components/RatingSummary";
import React from "react";

export const dynamic = "force-dynamic";

const iconMap: Record<string, React.ReactNode> = {
  shield: <Shield size={28} />,
  clock: <Clock size={28} />,
  tag: <Tag size={28} />,
  users: <Users size={28} />,
  truck: <Truck size={28} />,
  calendar: <Calendar size={28} />,
  settings: <Settings size={28} />,
  shieldcheck: <ShieldCheck size={28} />,
  award: <Award size={28} />,
  headset: <Headset size={28} />,
  droplets: <Droplets size={28} />,
  alarmclockcheck: <AlarmClockCheck size={28} />,
  shieldalert: <ShieldAlert size={28} />,
  waveshorizontal: <ZodiacAquarius size={28} />,
  toolbox: <Toolbox size={28} />,
};

export default async function HomePage() {
  const [
    categories,
    newArrivals,
    featuredProducts,
    projectImages,
    recentBlogs,
    specializations,
  ] = await Promise.all([
    getPublicCategories(),
    getPublicNewArrivals(8),
    getPublicFeaturedProducts(8),
    getPublicProjectImages(),
    getRecentPublishedBlogs(3),
    getPublicServiceSpecializations(),
  ]);

  return (
    <main>
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative w-full bg-[#0f172a] text-white overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/sendenquiry.png"
            alt="Fire Safety Solutions"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/40 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32 z-10">
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* ================= LEFT CONTENT ================= */}
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
                COMPLETE <span className="text-red-600">FIRE & SAFETY</span>{" "}
                SOLUTIONS UNDER ONE ROOF
              </h1>

              <p className="text-lg text-gray-300 max-w-xl">
                We provide end-to-end fire protection solutions from design to
                commissioning with unmatched quality and reliability.
              </p>

              {/* USP Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {[
                  { label: "TURNKEY SOLUTIONS", icon: ShieldCheck },
                  { label: "EXPERT ENGINEERS", icon: Users },
                  { label: "QUALITY ASSURED", icon: ShieldCheck },
                  { label: "24/7 SUPPORT", icon: Headset },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="border border-white/10 p-4 rounded-xl flex flex-col items-center text-center gap-3 bg-white/5 hover:border-red-600/50 transition-colors"
                  >
                    <item.icon size={28} className="text-red-600" />
                    <span className="text-xs font-bold tracking-wider">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold transition-all shadow-lg shadow-red-600/20"
                >
                  GET A QUOTE
                </Link>

                <Link
                  href="/projects"
                  className="border border-white hover:bg-white hover:text-black px-8 py-4 rounded-lg font-bold transition-all"
                >
                  VIEW PROJECTS
                </Link>
              </div>
            </div>

            {/* ================= RIGHT CONTENT ================= */}
            <div className="hidden lg:flex justify-center items-center mt-140">
              <div className="bg-red-600 rounded-2xl p-2 shadow-2xl flex items-center text-white">
                {/* Call */}
                <a
                  href={`tel:${companyInfo.contact.phoneHref}`}
                  className="flex items-center gap-2 px-6 py-4 hover:bg-red-700 rounded-xl transition-colors"
                >
                  <Phone size={22} />
                  <span className="text-sm font-bold uppercase">Call</span>
                </a>

                {/* Divider */}
                <div className="w-px h-10 bg-red-500 mx-1" />

                {/* Chat */}
                <a
                  href={`https://wa.me/${companyInfo.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-4 hover:bg-red-700 rounded-xl transition-colors"
                >
                  <MessageCircle size={22} />
                  <span className="text-sm font-bold uppercase">Chat</span>
                </a>

                {/* Divider */}
                <div className="w-px h-10 bg-red-500 mx-1" />

                {/* Consult */}
                <Link
                  href="/contact"
                  className="flex items-center gap-2 px-6 py-4 hover:bg-red-700 rounded-xl transition-colors"
                >
                  <Calendar size={22} />
                  <span className="text-sm font-bold uppercase">Consult</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ==================== ABOUT SECTION ==================== */}
      <section className="py-16 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-sm uppercase tracking-wider">
                  About Us
                </span>
                <div className="h-0.5 w-12 bg-red-600" />
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                  YOUR TRUSTED PARTNER FOR <br />
                  INDUSTRIAL FIRE &amp; SAFETY SOLUTIONS
                </h2>
                <p className="max-w-2xl text-gray-600 leading-relaxed">
                  Radiatech Electra delivers complete turnkey solutions for fire
                  protection, safety systems, and industrial piping. We combine
                  high-quality products, modern engineering, and disciplined
                  execution to protect lives, assets, and operations.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700"
                >
                  Learn More About Us
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Fire Protection Systems",
                  "Fire Alarm & Detection",
                  "Emergency Response Solutions",
                  "Safety Audit & Risk Assessment",
                  "Hydrant & Sprinkler Systems",
                  "Industrial Safety Solutions",
                  "AMC & Maintenance Services",
                  "Design, Supply, Installation & Commissioning",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <CheckCircle2
                      size={20}
                      className="mt-1 text-red-600 shrink-0"
                    />
                    <p className="text-sm font-medium text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[2rem] shadow-2xl bg-gray-100">
              <Image
                src="/images/main2.png"
                alt="Radiatech Electra Engineers"
                fill
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      {/* ==================== PRODUCT CATEGORIES ==================== */}
      <section className="py-20 sm:py-28 bg-white" id="products">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 bg-red-600" />
              <span className="text-red-600 font-bold text-sm uppercase tracking-[0.2em]">
                Our Collection
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Our Product Range
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Comprehensive range of Fire & Safety products, fittings, and
              industrial solutions meeting international standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((cat) => (
              <div
                key={cat.slug}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <Link
                  href={`/products/${cat.slug}`}
                  className="relative h-60 overflow-hidden block"
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-xl font-bold">{cat.name}</h3>
                    <span className="text-white/80 text-sm font-medium">
                      {cat.productCount} Available Products
                    </span>
                  </div>
                </Link>

                <div className="p-6 flex flex-col flex-1">
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                    {cat.description}
                  </p>

                  <div className="mt-auto flex items-center gap-3">
                    <Link
                      href={`/products/${cat.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      View <ChevronRight size={14} />
                    </Link>
                    <EnquiryButton
                      productName={cat.name}
                      className="flex-[1.5] inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-900 hover:border-red-600 hover:text-red-600 px-4 py-3 rounded-xl text-xs font-bold transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              View All Products <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      {/* ==================== NEW ARRIVALS ==================== */}
      {" "}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 bg-primary" />
              <span className="text-primary font-bold text-sm uppercase tracking-[0.2em]">
                Latest Additions
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              New Arrivals
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Explore our latest additions to the product range, featuring
              innovative designs and enhanced performance.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <Link
                  href={`/products/${product.categorySlug}/${product.id}`}
                  className="relative h-40 sm:h-56 overflow-hidden block"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent text-white text-[10px] font-extrabold px-3 py-1 rounded-full tracking-widest uppercase">
                      New
                    </span>
                  </div>
                </Link>

                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <Link
                    href={`/products/${product.categorySlug}/${product.id}`}
                    className="font-bold text-gray-900 text-sm mb-4 line-clamp-2 group-hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>

                  <div className="mt-auto grid grid-cols-1 gap-2">
                    <Link
                      href={`/products/${product.categorySlug}/${product.id}`}
                      className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                    >
                      View Product
                    </Link>
                    <EnquiryButton
                      productName={product.name}
                      label="Ask for Details"
                      className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-900 hover:border-primary hover:text-primary px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>{" "}
      */
      {/* ==================== FEATURED PRODUCTS ==================== */}
      {/* <section className="py-20 sm:py-28 bg-white" id="featured">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 bg-primary" />
              <span className="text-primary font-bold text-sm uppercase tracking-[0.2em]">
                Our Best
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Our most popular PPR-C piping products trusted by industries
              across India.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                <Link
                  href={`/products/${product.categorySlug}/${product.id}`}
                  className="relative h-40 sm:h-56 overflow-hidden block"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-full tracking-widest uppercase">
                      Featured
                    </span>
                  </div>
                </Link>

                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {product.category}
                  </span>
                  <Link
                    href={`/products/${product.categorySlug}/${product.id}`}
                    className="font-bold text-gray-900 text-sm mb-4 mt-1 line-clamp-2 group-hover:text-primary transition-colors"
                  >
                    {product.name}
                  </Link>

                  <div className="mt-auto grid grid-cols-1 gap-2">
                    <Link
                      href={`/products/${product.categorySlug}/${product.id}`}
                      className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                    >
                      View Product
                    </Link>
                    <EnquiryButton
                      productName={product.name}
                      label="Ask for Details"
                      className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-900 hover:border-primary hover:text-primary px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              Explore All Products <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section> */}
      {/* ==================== WHY CHOOSE US ==================== */}
      <section className="py-20 bg-white" id="why-choose-us">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              WHY CHOOSE RADIATECH ELECTRA?
            </h2>
            <div className="h-1.5 w-24 bg-red-600 mx-auto" />
          </div>

          {/* Horizontal List */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
            {companyInfo.whyChooseUs.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center group"
              >
                {/* Increased Size: w-20 h-20 */}
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 transition-transform group-hover:scale-105 shadow-sm">
                  <div className="text-red-600">
                    {iconMap[item.icon as keyof typeof iconMap] ? (
                      React.cloneElement(
                        iconMap[
                          item.icon as keyof typeof iconMap
                        ] as React.ReactElement,
                      )
                    ) : (
                      <Shield size={36} />
                    )}
                  </div>
                </div>

                {/* Increased Text: text-base and text-sm */}
                <h3 className="text-base font-bold text-gray-900 uppercase mb-3 tracking-wide">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-[160px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ==================== STATS SECTION ==================== */}
      <section className="py-10 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-6">
            {companyInfo.statsItems.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 flex-1 min-w-[200px]"
                >
                  {/* Icon */}
                  <div className="text-gray-400">
                    <Icon size={32} strokeWidth={1.5} />
                  </div>

                  {/* Stat Details */}
                  <div className="flex flex-col">
                    <div className="text-3xl font-bold text-red-600">
                      {stat.value}
                    </div>
                    <div className="text-[10px] tracking-widest text-white font-semibold uppercase">
                      {stat.label}
                    </div>
                  </div>

                  {/* Separator (Hide on last item) */}
                  {index < companyInfo.statsItems.length - 1 && (
                    <div className="hidden lg:block h-12 w-[1px] bg-gray-700 ml-6" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* ====================OUR SPECIALISATIONS=================== */}
      <section className="py-20 bg-white" id="specialisations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              OUR SPECIALISATIONS
            </h2>
            <div className="h-1.5 w-20 bg-red-600 mx-auto" />
          </div>

          {/* Auto-scrolling card row */}
          <div className="overflow-hidden">
            <div className="flex gap-6 py-8 min-w-max animate-marquee">
              {specializations.concat(specializations).map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex min-w-[320px] max-w-[320px] flex-col items-center text-center p-8 border border-gray-100 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative mb-8 h-40 w-full overflow-hidden rounded-3xl bg-slate-100">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">
                        No image
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 uppercase mb-4 px-2 tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-8 px-2">
                    {item.shortDescription}
                  </p>

                  <div className="h-1 w-12 bg-red-600 mt-auto rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ==================== WORK PROCESS ==================== */}
      <section className="py-24 bg-white" id="process">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
              OUR FIRE SAFETY PROCESS
            </h2>
            <div className="h-1.5 w-24 bg-red-600 mx-auto" />
          </div>

          {/* Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Site Hazard Audit",
                desc: "Comprehensive analysis of fire risks, building layout, and safety vulnerabilities.",
                icon: <ShieldAlert size={32} />,
              },
              {
                step: "02",
                title: "System Design",
                desc: "Engineered protection plans compliant with NFPA and local fire safety codes.",
                icon: <DraftingCompass size={32} />,
              },
              {
                step: "03",
                title: "Certified Integration",
                desc: "Installation of high-grade detection and suppression hardware by certified experts.",
                icon: <ShieldCheck size={32} />,
              },
              {
                step: "04",
                title: "Testing & Certification",
                desc: "Rigorous pressure testing and system commissioning to ensure instant activation.",
                icon: <ClipboardCheck size={32} />,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-8 rounded-3xl border border-gray-100 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-15px_rgba(220,38,38,0.2)] transition-all duration-500 group"
              >
                {/* Step Number Background */}
                <div className="absolute top-8 right-8 text-6xl font-black text-gray-50 opacity-5 group-hover:opacity-10 transition-opacity">
                  {item.step}
                </div>

                <div className="relative z-10">
                  {/* Icon Box */}
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                    {item.icon}
                  </div>

                  <div className="text-sm font-bold text-red-600 mb-2 tracking-widest uppercase opacity-70">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ==================== PROJECT SHOWCASE ==================== */}
      /*{" "}
      <section className="py-20 sm:py-28 bg-gray-50" id="projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 bg-primary" />
              <span className="text-primary font-bold text-sm uppercase tracking-[0.2em]">
                PORTFOLIO
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Our Projects
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Showcasing our expertise in industrial piping installations across
              process industries.
            </p>
          </div>

          <ExpandableGallery images={projectImages} initialLimit={6} />
        </div>
      </section>{" "}
      */
      {/* ==================== APPLICATIONS ==================== */}
      <section className="py-20 bg-gray-50" id="applications">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              FIRE SAFETY SOLUTIONS
            </h2>
            <div className="h-1.5 w-24 bg-red-600 mx-auto mb-6" />
            <p className="text-gray-600 max-w-lg mx-auto">
              Advanced fire protection systems engineered for industrial
              compliance and maximum safety.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "WATER-BASED PROTECTION",
                items: [
                  "Hydrant Network",
                  "Sprinkler Systems",
                  "Deluge Valves",
                  "Water Curtain",
                  "Fire Pumps",
                ],
              },
              {
                title: "GAS & FOAM SUPPRESSION",
                items: [
                  "CO2 Flooding Systems",
                  "Clean Agent Systems",
                  "Foam Generators",
                  "Foam Monitors",
                  "Kitchen Hood Systems",
                ],
              },
              {
                title: "DETECTION & ALARM",
                items: [
                  "Smoke Detectors",
                  "Heat Sensors",
                  "Manual Call Points",
                  "Control Panels",
                  "Public Address Systems",
                ],
              },
              {
                title: "PASSIVE FIRE SAFETY",
                items: [
                  "Fire Rated Doors",
                  "Fire Proofing",
                  "Smoke Curtains",
                  "Signage Systems",
                  "Emergency Lighting",
                ],
              },
            ].map((app) => (
              <div
                key={app.title}
                className="bg-white p-8 rounded-2xl border-b-4 border-red-600 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
              >
                {/* Card Header with Icon placeholder */}
                <div className="text-red-600 mb-6 group-hover:scale-110 transition-transform">
                  {/* Replace the static Shield with this mapping logic */}
                  <div className="text-red-600 mb-6 group-hover:scale-110 transition-transform">
                    {app.title === "WATER-BASED PROTECTION" && (
                      <Droplets size={48} strokeWidth={1.5} />
                    )}
                    {app.title === "GAS & FOAM SUPPRESSION" && (
                      <Flame size={48} strokeWidth={1.5} />
                    )}
                    {app.title === "DETECTION & ALARM" && (
                      <Bell size={48} strokeWidth={1.5} />
                    )}
                    {app.title === "PASSIVE FIRE SAFETY" && (
                      <Shield size={48} strokeWidth={1.5} />
                    )}
                  </div>
                </div>

                <h3 className="font-extrabold text-lg text-gray-900 mb-6 uppercase tracking-wider">
                  {app.title}
                </h3>

                <ul className="space-y-4">
                  {app.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-gray-700 font-medium"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ==================== RATINGS & REVIEWS ==================== */}
      {/* <section className="py-20 sm:py-28 bg-gray-50" id="reviews">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 bg-primary" />
              <span className="text-primary font-bold text-sm uppercase tracking-[0.2em]">
                IndiaMART Verified
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Ratings & Reviews
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              See what our customers say about us on IndiaMART.
            </p>
          </div>

          <RatingSummary />
        </div>
      </section> */}
      {/* ==================== TRUSTED CLIENTS ==================== */}
      {/* <section className="py-20 sm:py-28 bg-white" id="clients">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 bg-primary" />
              <span className="text-primary font-bold text-sm uppercase tracking-[0.2em]">
                Our Partners
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Trusted by{" "}
              <span className="text-primary">
                Industrial & Process Industries
              </span>
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Our clients include some of the most respected names in Indian
              industry.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {companyInfo.clientLogos.map((client) => (
              <div
                key={client.name}
                className="flex items-center justify-center h-32 bg-white rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 group"
              >
                <Image
                  src={client.image}
                  alt={client.name}
                  width={140}
                  height={60}
                  className="max-h-16 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </section> */}
      {/* ==================== BLOG / INSIGHTS ==================== */}
      /*{" "}
      <section className="py-20 sm:py-28 bg-white" id="blogs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-0.5 bg-primary" />
              <span className="text-primary font-bold text-sm uppercase tracking-[0.2em]">
                Latest News
              </span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Industry Insights & Updates
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Stay informed with the latest news, technical guides, and industry
              trends in PPR-C piping solutions.
            </p>
          </div>

          {recentBlogs.length === 0 ? (
            <div className="border border-dashed border-gray-200 bg-gray-50 rounded-3xl px-5 py-16 text-center text-sm text-gray-500">
              No blog posts published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentBlogs.map((post) => {
                const thumbnail =
                  post.coverImage ||
                  parseBlogImages(post.images)[0] ||
                  "/images/projects/WhatsApp Image 2026-04-17 at 12.17.21 PM.jpeg";
                return (
                  <Link
                    key={post.id}
                    href={`/blogs/${post.slug}`}
                    className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={thumbnail}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                        {new Date(
                          post.publishedAt || post.createdAt,
                        ).toLocaleDateString("en-IN", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <h3 className="font-bold text-gray-900 text-lg mb-3 leading-snug group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto text-primary text-sm font-bold flex items-center gap-2">
                        Read Article <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              View All Articles <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>{" "}
      */
      {/* ==================== CTA / INQUIRY SECTION ==================== */}
      <section className="py-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/sendenquiry.png"
            alt="Fire Safety Consultation"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/85 backdrop-blur-[2px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content Side */}
            <div className="text-white">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
                Ready to Secure Your <br />
                <span className="text-red-600">
                  Fire Safety Infrastructure?
                </span>
              </h2>
              <p className="text-gray-200 mb-8 text-lg">
                Get a professional consultation and custom safety audit. Our
                experts provide comprehensive fire protection solutions tailored
                to your site specific requirements.
              </p>

              <div className="space-y-4">
                {[
                  "Professional on-site fire safety assessment",
                  "Compliance-ready system design",
                  "Rapid response and technical support",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 font-medium"
                  >
                    <div className="p-1 rounded-full bg-red-600/20">
                      <CheckCircle size={18} className="text-red-600" />
                    </div>
                    <span className="text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Side */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">
                Request a Safety Consultation
              </h3>
              <InquiryForm compact onDark />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
