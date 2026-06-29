"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { companyInfo } from "@/data/company";
import useCategoryLinks from "@/components/useCategoryLinks";

export default function Footer() {
  const productLinks = useCategoryLinks();

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-8 ">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 ">
          {/* Company Info */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/LOGO.png"
                alt="Radiatech Electra"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-md font-bold text-white">
                Radiatech <span className="text-red-600">Electra</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-4 text-slate-400 max-w-sm">
              {companyInfo.about.short}
            </p>
            {/* Icons restored with correct SVG paths */}
            <div className="flex items-center gap-3">
              <a
                href={companyInfo.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent transition-all"
                aria-label="Facebook"
              >
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={companyInfo.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent transition-all"
                aria-label="Instagram"
              >
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.32.06 2.21.28 2.99.58.82.32 1.41.71 2.01 1.31.6.6.99 1.19 1.31 2.01.3.78.52 1.67.58 2.99.06 2.66.07 3.04.07 4.85s-.01 2.19-.07 3.48c-.06 1.32-.28 2.21-.58 2.99-.32.82-.71 1.41-1.31 2.01-.6.6-1.19.99-2.01 1.31-.78.3-1.67.52-2.99.58-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.32-.06-2.21-.28-2.99-.58-.82-.32-1.41-.71-2.01-1.31-.6-.6-.99-1.19-1.31-2.01-.3-.78-.52-1.67-.58-2.99-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.06-1.32.28-2.21.58-2.99.32-.82.71-1.41 1.31-2.01.6-.6 1.19-.99 2.01-1.31.78-.3 1.67-.52 2.99-.58 1.27-.06 1.65-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.058-2.148.26-2.913.56-.787.306-1.455.714-2.11 1.369-.654.654-1.063 1.323-1.369 2.11-.3.765-.502 1.636-.56 2.913-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.058 1.277.26 2.148.56 2.913.306.787.714 1.455 1.369 2.11.654.654 1.323 1.063 2.11 1.369.765.3 1.636.502 2.913.56 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.058 2.148-.26 2.913-.56.787-.306 1.455-.714 2.11-1.369.654-.654 1.063-1.323 1.369-2.11.3-.765.502-1.636.56-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.058-1.277-.26-2.148-.56-2.913-.306-.787-.714-1.455-1.369-2.11-.654-.654-1.323-1.063-2.11-1.369-.765-.3-1.636-.502-2.913-.56-1.28-.058-1.688-.072-4.947-.072zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4 2.209 0 4 1.791 4 4 0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.441s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.441-1.441-1.441z" />
                </svg>
              </a>

              <a
                href={companyInfo.social.indiamart}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent transition-all text-xs font-bold uppercase"
                aria-label="IndiaMART"
              >
                IM
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Why Us", href: "/why-us" },
                { label: "Fire Systems", href: "/products" },
                { label: "Specialisation", href: "/specialisation" },
                { label: "Projects", href: "/projects" },
                { label: "Blogs", href: "/blogs" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-accent transition-colors text-xs whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Products */}
          {/* <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Our Products
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-accent transition-colors text-xs whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold text-white mb-3">
              Get In Touch
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                <span className="text-xs">
                  {companyInfo.addresses[0].address}
                </span>
              </li>
              <li className="flex items-center gap-2 text-xs">
                <Phone size={14} className="text-accent shrink-0" />
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${companyInfo.contact.phone1}`}
                    className="hover:text-accent transition-colors"
                  >
                    {companyInfo.contact.phone1}
                  </a>
                  <span className="text-slate-600">/</span>
                  <a
                    href={`tel:${companyInfo.contact.phone2}`}
                    className="hover:text-accent transition-colors"
                  >
                    {companyInfo.contact.phone2}
                  </a>
                </div>
              </li>
              <li>
                <a
                  href={`mailto:${companyInfo.contact.email}`}
                  className="flex items-center gap-2 hover:text-accent transition-colors text-xs"
                >
                  <Mail size={14} className="text-accent shrink-0" />{" "}
                  {companyInfo.contact.email}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Link
                href="/contact"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold transition-colors"
              >
                Send Inquiry
              </Link>
              <a
                href={companyInfo.social.indiamart}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 border border-white/10 px-4 py-2 rounded text-xs font-semibold text-white hover:bg-white/5 transition-colors"
              >
                IndiaMART <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-red-600">
        {" "}
        {/* Apply bg color here */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-white">
          {/* Inner container handles the max-width and centering */}
          <p>
            &copy; {new Date().getFullYear()} {companyInfo.fullName}. All Rights
            Reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-slate-200">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-slate-200">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
