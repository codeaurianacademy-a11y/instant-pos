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
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Draft bills</h1>
          <p className="text-sm text-muted">Resume a saved bill to complete the sale.</p>
        </div>
        <Link href="/sales">
          <Button>New sale</Button>
        </Link>
      </div>

      {drafts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="No drafts" description="Bills saved as draft will appear here." />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <Link key={draft.id} href={`/sales?draftId=${draft.id}`}>
              <Card className="hover:border-accent transition-colors">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {draft.customer?.name ?? "Walk-in"}
                      </p>
                      {draft.customer?.phone && <Badge tone="neutral">{draft.customer.phone}</Badge>}
                    </div>
                    <p className="text-sm text-muted">
                      {draft.items.length} item{draft.items.length !== 1 ? "s" : ""} •{" "}
                      {formatDateTime(draft.createdAt)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(Number(draft.grandTotal))}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
