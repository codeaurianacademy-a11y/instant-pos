import Link from "next/link";
import { listDrafts } from "@/server/services/saleService";
import { getSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function DraftsPage() {
  const session = await getSession();
  const drafts = await listDrafts(session?.role === "ADMIN" ? undefined : session?.sub);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Draft Bills & Held Orders</h1>
          <p className="text-sm text-muted mt-0.5">Resume a previously saved cart to complete payment.</p>
        </div>
        <Link href="/sales">
          <Button size="md" className="font-semibold">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Sale
          </Button>
        </Link>
      </div>

      {drafts.length === 0 ? (
        <Card className="shadow-xs">
          <CardContent className="py-16">
            <EmptyState title="No saved drafts" description="Bills saved as draft during checkout will appear here for fast retrieval." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((draft) => (
            <Link key={draft.id} href={`/sales?draftId=${draft.id}`} className="block group">
              <Card className="h-full group-hover:border-accent group-hover:shadow-md transition-all duration-150 shadow-xs">
                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {draft.customer?.name ?? "Walk-in Customer"}
                        </p>
                        {draft.customer?.phone && (
                          <Badge tone="neutral" className="text-[10px] shrink-0 font-mono">
                            {draft.customer.phone}
                          </Badge>
                        )}
                      </div>
                      <Badge tone="accent">Draft</Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {draft.items.length} item{draft.items.length !== 1 ? "s" : ""} in cart • Saved {formatDateTime(draft.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/80 pt-3">
                    <span className="text-xs font-semibold text-accent group-hover:underline inline-flex items-center gap-1">
                      Resume Order &rarr;
                    </span>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(Number(draft.grandTotal))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
