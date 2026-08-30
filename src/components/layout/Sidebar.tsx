"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Role } from "@/generated/prisma/enums";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  adminOnly?: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function SellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function TransactionsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function DraftsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function InventoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function BarcodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", adminOnly: true, icon: DashboardIcon },
  { href: "/sales", label: "Sell (POS)", shortLabel: "Sell", icon: SellIcon },
  { href: "/transactions", label: "Transactions", shortLabel: "History", icon: TransactionsIcon },
  { href: "/sales/drafts", label: "Draft Orders", shortLabel: "Drafts", icon: DraftsIcon },
  { href: "/inventory", label: "Inventory", shortLabel: "Stock", adminOnly: true, icon: InventoryIcon },
  { href: "/barcodes", label: "Barcode Labels", shortLabel: "Barcodes", adminOnly: true, icon: BarcodeIcon },
  { href: "/reports", label: "Reports & Export", shortLabel: "Reports", adminOnly: true, icon: ReportsIcon },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/sales") {
    return pathname === "/sales" || (pathname.startsWith("/sales/") && !pathname.startsWith("/sales/drafts"));
  }
  if (href === "/sales/drafts") {
    return pathname === "/sales/drafts" || pathname.startsWith("/sales/drafts/");
  }
  if (href === "/transactions") {
    return pathname === "/transactions" || pathname.startsWith("/transactions/");
  }
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarProps {
  user: { name: string; username: string; role: Role };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN");

  const renderNavList = (onItemClick?: () => void) => (
    <div className="flex flex-col gap-1">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
        {user.role === "ADMIN" ? "Admin Navigation" : "Cashier Terminal"}
      </p>
      {visibleItems.map((item) => {
        const isActive = isNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-accent text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-foreground hover:bg-slate-100"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 transition-transform", isActive ? "text-white" : "text-slate-400")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar (>= lg) */}
      <aside className="hidden lg:flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface shadow-xs z-30">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white font-bold shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-base font-bold text-foreground tracking-tight block leading-none">Instant POS</span>
              <span className="text-[11px] text-muted font-medium mt-0.5 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {user.role === "ADMIN" ? "Terminal #1 Active" : "Sales Counter Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-between">
          {renderNavList()}

          <div className="mx-2 mt-6 rounded-lg bg-slate-50 border border-border/80 p-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <svg className="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Tip
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              Scan barcode directly or use camera scanner to instantly add items.
            </p>
          </div>
        </nav>

        {/* User Section at Bottom */}
        <div className="border-t border-border bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-border/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">{user.name}</p>
                <span className="inline-block text-[10px] font-medium text-muted uppercase tracking-wider">
                  {user.role === "ADMIN" ? "Administrator" : "Salesman"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Top Navigation Header (< lg) */}
      <div className="lg:hidden sticky top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b border-border px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white font-bold text-xs">
              POS
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">Instant POS</span>
          </div>
        </div>

        {/* User Pill on Mobile Topbar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 border border-border text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="max-w-[90px] truncate text-[11px]">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Mobile Slide-Over Drawer Menu (< lg) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative flex w-72 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-bold text-xs">
                  POS
                </div>
                <span className="font-bold text-foreground">Instant POS</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              {renderNavList(() => setIsMobileMenuOpen(false))}
            </nav>

            <div className="p-4 border-t border-border bg-slate-50">
              <p className="text-xs font-semibold text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted">{user.role === "ADMIN" ? "Administrator" : "Salesman"}</p>
              <button
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Mobile Bottom Quick Action Bar (< lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around shadow-lg">
        {visibleItems.slice(0, 4).map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors min-w-[60px]",
                isActive ? "text-accent font-bold" : "text-slate-500 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-accent" : "text-slate-400")} />
              <span className="text-[10px] mt-0.5 leading-tight">{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
        {visibleItems.length > 4 && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-slate-500 hover:text-foreground min-w-[60px]"
          >
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px] mt-0.5 leading-tight">More</span>
          </button>
        )}
      </div>
    </>
  );
}
