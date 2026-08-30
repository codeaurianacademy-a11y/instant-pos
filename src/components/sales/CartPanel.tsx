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
    return <EmptyState title="Cart is empty" description="Scan a product to add it to the cart." />;
  }

  return (
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
            <TableCell className="font-medium">{line.product.name}</TableCell>
            <TableCell>{formatCurrency(line.product.sellingPrice)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onQuantityChange(line.product.id, line.quantity - 1)}
                  className="h-7 w-7 rounded-md border border-border text-foreground hover:bg-slate-50"
                  aria-label={`Decrease quantity of ${line.product.name}`}
                >
                  −
                </button>
                <span className="w-8 text-center">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(line.product.id, line.quantity + 1)}
                  className="h-7 w-7 rounded-md border border-border text-foreground hover:bg-slate-50"
                  aria-label={`Increase quantity of ${line.product.name}`}
                >
                  +
                </button>
              </div>
            </TableCell>
            <TableCell>
              {formatCurrency(Number(line.product.sellingPrice) * line.quantity - line.lineDiscount)}
            </TableCell>
            <TableCell>
              <Button size="sm" variant="ghost" onClick={() => onRemove(line.product.id)}>
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
