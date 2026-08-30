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
      <CardHeader>
        <CardTitle>Low stock</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <EmptyState title="All stocked up" description="No products are below their low-stock threshold." />
        ) : (
          <ul className="divide-y divide-border">
            {products.map((product) => (
              <li key={product.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted">{product.barcode}</p>
                </div>
                <Badge tone={product.stockQty === 0 ? "danger" : "warning"}>
                  {product.stockQty} left
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
