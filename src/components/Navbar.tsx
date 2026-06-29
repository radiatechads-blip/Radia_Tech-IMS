"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Phone, Mail, MapPin, ChevronDown } from "lucide-react";
import { companyInfo } from "@/data/company";
import useCategoryLinks from "@/components/useCategoryLinks";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Why Us", href: "/why-us" },
  { label: "Fire Systems", href: "/products" },
  { label: "Specialisation", href: "/specialisation" },
  { label: "Projects", href: "/projects" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const productLinks = useCategoryLinks();

  return (
    <>
      {/* Top Bar */}
      <div className="bg-red-700 text-white text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-none min-w-0">
            <span className="flex items-center gap-1 shrink-0">
              <MapPin size={14} />
              Noida, Uttar Pradesh, India
            </span>
            <span className="flex">
              <a href={`tel:${companyInfo.contact.phoneHref}`} className="flex items-center gap-1 hover:text-red-200 transition-colors shrink-0">
                <Phone size={14} />
                {companyInfo.contact.phone1}
              </a>
              {" "}/{" "}
              <a href={`tel:${companyInfo.contact.phoneHref}`} className="flex items-center gap-1 hover:text-red-200 transition-colors shrink-0">
                {companyInfo.contact.phone2}
              </a>
            </span>
            <a href={`mailto:${companyInfo.contact.email}`} className="hidden sm:flex items-center gap-1 hover:text-red-200 transition-colors shrink-0">
              <Mail size={14} />
              {companyInfo.contact.email}
            </a>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {["facebook", "instagram", "indiamart"].map((s) => (
              <a key={s} href={companyInfo.social[s as keyof typeof companyInfo.social]} target="_blank" rel="noopener noreferrer" className="hover:text-red-200 transition-colors" aria-label={s}>
                <SocialIcon name={s} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/LOGO.png" alt="Radiatech Electra" width={40} height={40} className="object-contain" priority />
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Radiatech <span className="text-red-600">Electra</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) =>
                link.href === "/products" ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 cursor-pointer transition-colors underline-offset-4 hover:underline decoration-2">
                      {link.label}
                      <ChevronDown size={14} className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
                    </div>
                    
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 bg-white shadow-2xl border border-gray-100 py-3 min-w-[220px] rounded-b-xl animate-in fade-in slide-in-from-top-2">
                        {productLinks.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-6 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 transition-colors "
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors underline-offset-4 hover:underline decoration-2"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-4">
              <Link
                href="/contact"
                className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-600/20"
              >
                Get Quote
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-gray-700"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-b border-gray-100 shadow-xl px-4 py-6 space-y-2 animate-in slide-in-from-top-4">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
                {link.href === "/products" && productLinks.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className="block pl-10 py-2 text-sm text-gray-500 hover:text-red-600"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

function SocialIcon({ name }: { name: string }) {
  const size = 16;
  switch (name) {
    case "facebook":
      return (
        <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "indiamart":
      return <span className="text-[11px] font-bold leading-none">IM</span>;
    default:
      return null;
  }
}