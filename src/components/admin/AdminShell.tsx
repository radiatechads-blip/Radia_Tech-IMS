"use client";

import { companyInfo } from "@/data/company";
import { BarChart3, Bell, DollarSign, ExternalLink, FileText, FolderTree, Inbox, IndianRupee, LogOut, Menu, Package, TrendingUp, UserCircle, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: BarChart3 },
  { label: "Generate Bill", href: "/admin/generate-bill", icon: FileText },
  { label: "Payment IN", href: "/admin/payment-in", icon: DollarSign },
  { label: "Alerts", href: "/admin/alerts", icon: Bell },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Payment/Salary Record", href: "/admin/payment-salary-record", icon: IndianRupee },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Stock", href: "/admin/stock", icon: TrendingUp },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Business Insight", href: "/admin/business-insight", icon: Inbox },
  { label: "My Profile", href: "/admin/profile", icon: UserCircle },
];

interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({
  children,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user?: AdminUser }) => { if (data.user) setAdminUser(data.user); })
      .catch(() => null);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const buttonMotionStyles = (
    <style jsx global>{`
      @keyframes sweepMove {
        0% {
          left: -40%;
          opacity: 0;
        }
        20% {
          opacity: 0.9;
        }
        100% {
          left: 140%;
          opacity: 0;
        }
      }
    `}</style>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-[#081f49] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center bg-white shadow-sm">
            <Image src="/LOGO.png" alt={companyInfo.name} width={34} height={34} className="h-8 w-8 object-contain" />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight">Radiatech Electra</span>
            <span className="mt-0.5 inline-flex bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">IMS</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-[#081f49] shadow-sm"
                  : "text-white/72 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {adminUser && (
          <Link
            href="/admin/profile"
            className="mb-2 flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
              {(adminUser.name ?? adminUser.email).charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{adminUser.name ?? "Admin"}</span>
              <span className="block truncate text-xs text-white/55">{adminUser.email}</span>
            </span>
          </Link>
        )}
        {/* <Link href="/" className="mb-2 block px-3 py-2 text-xs font-medium text-white/55 hover:text-white">
          View public website
        </Link> */}
        {/* <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-red-500/20 hover:text-red-100"
        >
          <LogOut size={18} />
          Logout
        </button> */}
      </div>
    </div>
  );

  return (
    <>
      {buttonMotionStyles}
      <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[280px_1fr] print:block print:bg-white">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto lg:block print:hidden">{sidebar}</aside>

      {sidebarOpen && <button aria-label="Close menu overlay" className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] transform transition-transform duration-200 lg:hidden print:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
                aria-label="Open admin navigation"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                <p className="hidden truncate text-xs text-slate-500 sm:block">Radiatech Electra management console</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="https://www.radiatech.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-full border border-green-200 bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(16,185,129,0.35)]"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 w-[40%] rotate-12 bg-white/35 blur-sm"
                  style={{ animation: "sweepMove 1.4s linear infinite" }}
                />
                <span className="relative z-10 inline-flex items-center gap-2">
                  <ExternalLink size={16} />
                  PPR-C Pipes & Fitting
                </span>
              </Link>
              <Link
                href="https://www.radiatechfire.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-full border border-red-200 bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(239,68,68,0.35)]"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 w-[40%] rotate-12 bg-white/35 blur-sm"
                  style={{ animation: "sweepMove 1.4s linear infinite" }}
                />
                <span className="relative z-10 inline-flex items-center gap-2">
                  <ExternalLink size={16} />
                  Fire & Safety
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="group relative overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 w-[40%] rotate-12 bg-slate-200/80 blur-sm"
                  style={{ animation: "sweepMove 1.4s linear infinite" }}
                />
                <span className="relative z-10 inline-flex items-center gap-2">
                  <LogOut size={16} />
                  Logout
                </span>
              </button>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="sr-only"
              aria-label="Close admin navigation"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:px-0 print:py-0 print:overflow-visible">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
              {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  </>
  );
}