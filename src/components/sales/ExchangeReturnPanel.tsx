import { formatCurrency } from "@/lib/format";

export interface ReturnableItem {
  productId: string;
  productName: string;
  unitPrice: string;         // effective price per unit actually paid (after discount)
  originalUnitPrice?: string; // MRP / selling price for reference
  maxQuantity: number;
}

interface ExchangeReturnPanelProps {
  items: ReturnableItem[];
  returnQuantities: Record<string, number>;
  onChange: (productId: string, quantity: number) => void;
}

export function ExchangeReturnPanel({ items, returnQuantities, onChange }: ExchangeReturnPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const qty = returnQuantities[item.productId] ?? 0;
        const effectivePrice = Number(item.unitPrice);
        const originalPrice = item.originalUnitPrice ? Number(item.originalUnitPrice) : effectivePrice;
        const hasDiscount = Math.abs(effectivePrice - originalPrice) > 0.01;

        return (
          <div
            key={item.productId}
            className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">{item.productName}</p>
              <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                {hasDiscount ? (
                  <>
                    <span className="line-through text-slate-400">{formatCurrency(originalPrice)}</span>
                    <span className="text-emerald-600 font-bold">{formatCurrency(effectivePrice)} paid each</span>
                    <span className="text-muted">•</span>
                  </>
                ) : (
                  <span>{formatCurrency(effectivePrice)} each •</span>
                )}
                <span>{item.maxQuantity} purchased</span>
              </p>
              {qty > 0 && (
                <p className="text-[11px] font-bold text-accent mt-1">
                  Credit: {formatCurrency(effectivePrice * qty)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onChange(item.productId, Math.max(0, qty - 1))}
                className="h-8 w-8 rounded-lg border border-border bg-slate-50 text-foreground hover:bg-slate-100 font-bold text-sm flex items-center justify-center"
                aria-label={`Decrease return quantity of ${item.productName}`}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => onChange(item.productId, Math.min(item.maxQuantity, qty + 1))}
                className="h-8 w-8 rounded-lg border border-border bg-slate-50 text-foreground hover:bg-slate-100 font-bold text-sm flex items-center justify-center"
                aria-label={`Increase return quantity of ${item.productName}`}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
