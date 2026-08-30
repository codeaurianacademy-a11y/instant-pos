import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  getTodaysSalesSummary,
  getLowStockProducts,
  getRecentTransactions,
} from "@/server/services/dashboardService";
import { StatCard } from "@/components/dashboard/StatCard";
import { LowStockList } from "@/components/dashboard/LowStockList";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const session = await getSession();
  const [salesSummary, lowStockProducts, recentTransactions] = await Promise.all([
    getTodaysSalesSummary(),
    getLowStockProducts(),
    getRecentTransactions(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back{session ? `, ${session.name}` : ""}
          </h1>
          <p className="text-sm text-muted mt-0.5">Here is an overview of today&apos;s store activity and sales.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/sales">
            <Button size="md" className="shadow-xs font-semibold">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Sale
            </Button>
          </Link>
          <Link href="/sales/drafts">
            <Button variant="secondary" size="md">
              Drafts
            </Button>
          </Link>
          {session?.role === "ADMIN" && (
            <Link href="/inventory">
              <Button variant="secondary" size="md">
                Inventory
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(salesSummary.totalAmount)}
          tone="success"
          icon={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <span className="font-bold text-sm">₹</span>
            </div>
          }
        />
        <StatCard
          label="Bills Completed"
          value={String(salesSummary.billCount)}
          hint={salesSummary.billCount > 0 ? "Active shift" : "No sales yet today"}
          icon={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          }
        />
        <StatCard
          label="Low Stock Items"
          value={String(lowStockProducts.length)}
          hint={lowStockProducts.length > 0 ? `${lowStockProducts.length} items need restock` : "All items well stocked"}
          tone={lowStockProducts.length > 0 ? "warning" : "default"}
          icon={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          }
        />
      </div>

      {/* Grid: Low Stock & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <LowStockList products={lowStockProducts} />
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
}
