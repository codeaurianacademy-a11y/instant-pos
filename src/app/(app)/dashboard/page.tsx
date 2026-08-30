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
    <div className="flex flex-col gap-6 p-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Welcome{session ? `, ${session.name}` : ""}
          </h1>
          <p className="text-sm text-muted">Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sales">
            <Button size="lg">New sale</Button>
          </Link>
          <Link href="/sales/drafts">
            <Button variant="secondary" size="lg">
              Drafts
            </Button>
          </Link>
          {session?.role === "ADMIN" && (
            <Link href="/inventory">
              <Button variant="secondary" size="lg">
                Inventory
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's sales" value={formatCurrency(salesSummary.totalAmount)} />
        <StatCard label="Bills today" value={String(salesSummary.billCount)} />
        <StatCard
          label="Low stock items"
          value={String(lowStockProducts.length)}
          hint={lowStockProducts.length > 0 ? "Needs attention" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LowStockList products={lowStockProducts} />
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
}
