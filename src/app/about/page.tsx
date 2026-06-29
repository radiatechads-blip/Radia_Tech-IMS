"use client";

import Image from "next/image";
import { Award, Target, Eye } from "lucide-react";
import { companyInfo } from "@/data/company";

export default function AboutPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero: Modern Red Gradient */}
      <section className="relative bg-red-700 py-5 mb-5">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-6">
            About <span className="text-red-200">Radiatech</span>
          </h1>
          <p className="text-red-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Pioneering excellence in fire safety and industrial solutions with a steadfast commitment to quality and innovation.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 -mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-2xl shadow-red-900/10 border border-gray-100 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">Our Legacy</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-4 mb-6">Building a Safer Future</h2>
              <div className="prose prose-gray leading-relaxed text-gray-600">
                {companyInfo.about.description.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
            <div className="relative group">
              <Image src="/images/About page.png" alt="Company Story" width={600} height={400} className="rounded-3xl w-full h-[450px] object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]" />
              <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-5xl font-extrabold text-red-600 mb-1">5+</div>
                <div className="text-sm font-bold text-gray-900 uppercase">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission/Vision Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { icon: Target, title: "Our Mission", desc: companyInfo.about.mission, color: "text-red-600" },
            { icon: Eye, title: "Our Vision", desc: companyInfo.about.vision, color: "text-red-600" },
            { icon: Award, title: "Core Values", desc: "Quality, Integrity, Innovation, and Customer Satisfaction form our foundation.", color: "text-red-600" }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <item.icon size={40} className={`${item.color} mb-6`} />
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Factsheet */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Company Profile</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            {[
              { label: "Founded", value: companyInfo.established },
              { label: "CEO", value: companyInfo.ceo },
              { label: "Employees", value: companyInfo.employees },
              { label: "Address", value: companyInfo.addresses[0].address },
            ].map((row, i) => (
              <div key={i} className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="w-1/3 p-6 font-bold text-gray-400 uppercase text-xs tracking-wider">{row.label}</div>
                <div className="w-2/3 p-6 text-gray-900 font-medium">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}