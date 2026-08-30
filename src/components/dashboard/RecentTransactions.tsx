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
  customer: { name: string } | null;
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Completed sales will show up here." />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{tx.billNumber}</p>
                    {tx.type === "EXCHANGE" && <Badge tone="accent">Exchange</Badge>}
                    {tx.status === "VOIDED" && <Badge tone="danger">Voided</Badge>}
                  </div>
                  <p className="text-xs text-muted truncate">
                    {tx.customer?.name ?? "Walk-in"} • {tx.cashier.name}
                    {tx.completedAt && ` • ${formatDateTime(tx.completedAt)}`}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground shrink-0">
                  {formatCurrency(tx.grandTotal)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
