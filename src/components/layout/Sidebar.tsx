"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Role } from "@/generated/prisma/enums";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sales", label: "Sell" },
  { href: "/sales/drafts", label: "Drafts" },
  { href: "/inventory", label: "Inventory", adminOnly: true },
  { href: "/reports", label: "Reports", adminOnly: true },
];

interface SidebarProps {
  user: { name: string; username: string; role: Role };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN");

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-5 py-5 border-b border-border">
        <span className="text-lg font-semibold text-foreground">Instant POS</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-slate-100"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted truncate">{user.role === "ADMIN" ? "Admin" : "Cashier"}</p>
        <button
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
