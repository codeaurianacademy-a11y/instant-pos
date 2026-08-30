import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface LowStockProduct {
  id: string;
  name: string;
  barcode: string;
  stockQty: number;
  lowStockAlert: number;
}

export function LowStockList({ products }: { products: LowStockProduct[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between border-b border-border/80 pb-3.5">
        <CardTitle className="text-base font-bold text-foreground">Low stock</CardTitle>
        {products.length > 0 && (
          <Link href="/inventory" className="text-xs font-semibold text-accent hover:underline">
            Manage Stock →
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="p-8">
            <EmptyState title="All stocked up" description="No products are below their low-stock threshold." />
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <ul className="divide-y divide-border">
              {products.map((product) => (
                <li key={product.id}>
                  <Link
                    href="/inventory"
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-semibold text-foreground group-hover:text-accent truncate">
                        {product.name}
                      </p>
                      <p className="text-xs font-mono text-muted">{product.barcode}</p>
                    </div>
                    <Badge tone={product.stockQty === 0 ? "danger" : "warning"}>
                      {product.stockQty} left
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
