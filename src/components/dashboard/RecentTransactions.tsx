import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { SaleType, SaleStatus } from "@/generated/prisma/enums";

interface Transaction {
  id: string;
  billNumber: string;
  type: SaleType;
  status: SaleStatus;
  grandTotal: number;
  completedAt: Date | null;
  cashier: { name: string };
  customer: { name: string; phone?: string | null } | null;
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between border-b border-border/80 pb-3.5">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-bold text-foreground">Recent transactions</CardTitle>
          <span className="text-xs text-muted font-normal">• Click to view / exchange</span>
        </div>
        <Link href="/transactions" className="text-xs font-semibold text-accent hover:underline">
          View All Transactions →
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No transactions yet" description="Completed sales will show up here." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => {
              const hasName = tx.customer?.name && tx.customer.name.trim() !== "" && tx.customer.name.trim() !== "Walk-in" && tx.customer.name.trim() !== "Customer";
              const hasPhone = tx.customer?.phone && tx.customer.phone.trim() !== "" && !tx.customer.phone.startsWith("phone_") && !tx.customer.phone.startsWith("temp_");
              
              const displayName = hasName 
                ? tx.customer!.name 
                : hasPhone 
                  ? `Phone: ${tx.customer!.phone}` 
                  : "Walk-in Customer";

              const shortBillNo = tx.billNumber.length > 10 
                ? `Bill #${tx.billNumber.slice(-8).toUpperCase()}` 
                : `Bill #${tx.billNumber}`;

              return (
                <li key={tx.id}>
                  <Link
                    href={`/sales/${tx.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                          {displayName}
                        </p>
                        {hasName && hasPhone && (
                          <span className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-100 font-semibold px-2 py-0.5 rounded">
                            {tx.customer!.phone}
                          </span>
                        )}
                        {tx.type === "EXCHANGE" && (
                          <Badge tone={tx.grandTotal <= 0 ? "danger" : "accent"}>
                            {tx.grandTotal <= 0 ? "Return" : "Exchange"}
                          </Badge>
                        )}
                        {tx.status === "VOIDED" && <Badge tone="danger">Voided</Badge>}
                      </div>
                      <p className="text-xs text-muted truncate mt-0.5">
                        <span className="font-mono text-slate-500 font-medium">{shortBillNo}</span>
                        <span> • Cashier: {tx.cashier.name}</span>
                        {tx.completedAt && <span> • {formatDateTime(tx.completedAt)}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatCurrency(tx.grandTotal)}
                      </span>
                      <svg
                        className="h-4 w-4 text-slate-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
