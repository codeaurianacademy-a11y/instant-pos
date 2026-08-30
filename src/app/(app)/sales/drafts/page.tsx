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
          {drafts.map((draft) => {
            const hasName = draft.customer?.name && draft.customer.name.trim() !== "" && draft.customer.name.trim() !== "Walk-in" && draft.customer.name.trim() !== "Customer";
            const hasPhone = draft.customer?.phone && draft.customer.phone.trim() !== "" && !draft.customer.phone.startsWith("phone_");

            const customerHeading = hasName
              ? draft.customer!.name
              : hasPhone
                ? `Phone: ${draft.customer!.phone}`
                : "Walk-in Customer";

            return (
              <Link key={draft.id} href={`/sales?draftId=${draft.id}`} className="block group">
                <Card className="h-full group-hover:border-accent group-hover:shadow-md transition-all duration-150 shadow-xs border-border">
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-bold text-base text-foreground group-hover:text-accent transition-colors truncate">
                            {customerHeading}
                          </p>
                          {hasName && hasPhone && (
                            <span className="text-xs font-mono text-muted mt-0.5 block">
                              Ph: {draft.customer!.phone}
                            </span>
                          )}
                        </div>
                        <Badge tone="accent">Draft</Badge>
                      </div>

                      {/* Items count & list */}
                      <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs text-slate-600">
                        <span className="font-semibold block mb-0.5 text-slate-700">
                          {draft.items.length} item{draft.items.length !== 1 ? "s" : ""} in cart:
                        </span>
                        <p className="truncate text-[11px] text-muted">
                          {draft.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                        </p>
                      </div>

                      <p className="text-[11px] text-muted mt-2">
                        Saved: {formatDateTime(draft.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/80 pt-3 mt-1">
                      <span className="text-xs font-bold text-accent group-hover:underline inline-flex items-center gap-1">
                        Resume Order &rarr;
                      </span>
                      <p className="text-lg font-extrabold text-foreground">
                        {formatCurrency(Number(draft.grandTotal))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
