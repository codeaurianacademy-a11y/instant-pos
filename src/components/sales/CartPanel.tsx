import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { CartLine } from "@/lib/cart";

interface CartPanelProps {
  cart: CartLine[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartPanel({ cart, onQuantityChange, onRemove }: CartPanelProps) {
  if (cart.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 shadow-xs">
        <EmptyState title="Cart is empty" description="Scan a barcode or use camera scanner to add items." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Desktop Table View (hidden on sm/mobile) */}
      <div className="hidden sm:block rounded-xl border border-border bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Price</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell />
            </tr>
          </TableHead>
          <TableBody>
            {cart.map((line) => (
              <TableRow key={line.product.id}>
                <TableCell className="font-semibold text-foreground">{line.product.name}</TableCell>
                <TableCell>{formatCurrency(line.product.sellingPrice)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(line.product.id, line.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-slate-50 text-slate-700 hover:bg-slate-200 font-bold text-xs cursor-pointer"
                      aria-label={`Decrease quantity of ${line.product.name}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-xs">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(line.product.id, line.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-slate-50 text-slate-700 hover:bg-slate-200 font-bold text-xs cursor-pointer"
                      aria-label={`Increase quantity of ${line.product.name}`}
                    >
                      +
                    </button>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-foreground">
                  {formatCurrency(Number(line.product.sellingPrice) * line.quantity - line.lineDiscount)}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => onRemove(line.product.id)} className="text-red-600 hover:bg-red-50">
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 2. Mobile Touch Cards View (sm:hidden) */}
      <div className="sm:hidden flex flex-col gap-2.5">
        {cart.map((line) => {
          const lineTotal = Number(line.product.sellingPrice) * line.quantity - line.lineDiscount;
          return (
            <div key={line.product.id} className="rounded-xl border border-border bg-white p-3.5 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight">{line.product.name}</p>
                  <span className="text-[11px] font-mono text-muted">{line.product.barcode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(line.product.id)}
                  aria-label="Remove item"
                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(line.product.id, line.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-100 text-slate-800 font-bold text-sm"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(line.product.id, line.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-100 text-slate-800 font-bold text-sm"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-muted">{formatCurrency(line.product.sellingPrice)} each</p>
                  <p className="text-base font-extrabold text-foreground">{formatCurrency(lineTotal)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
