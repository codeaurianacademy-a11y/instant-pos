import { Badge } from "@/components/ui/Badge";

export function StockBadge({ stockQty, lowStockAlert }: { stockQty: number; lowStockAlert: number }) {
  if (stockQty === 0) {
    return <Badge tone="danger">Out of stock</Badge>;
  }
  if (stockQty <= lowStockAlert) {
    return <Badge tone="warning">{stockQty} left</Badge>;
  }
  return <Badge tone="success">{stockQty} in stock</Badge>;
}
