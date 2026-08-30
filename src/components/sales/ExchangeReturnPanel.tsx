import { formatCurrency } from "@/lib/format";

export interface ReturnableItem {
  productId: string;
  productName: string;
  unitPrice: string;
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
        return (
          <div
            key={item.productId}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.productName}</p>
              <p className="text-xs text-muted">
                {formatCurrency(item.unitPrice)} each • {item.maxQuantity} purchased
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange(item.productId, Math.max(0, qty - 1))}
                className="h-7 w-7 rounded-md border border-border text-foreground hover:bg-slate-50"
                aria-label={`Decrease return quantity of ${item.productName}`}
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button
                type="button"
                onClick={() => onChange(item.productId, Math.min(item.maxQuantity, qty + 1))}
                className="h-7 w-7 rounded-md border border-border text-foreground hover:bg-slate-50"
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
