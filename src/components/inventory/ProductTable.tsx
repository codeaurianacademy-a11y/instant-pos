import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { StockBadge } from "@/components/inventory/StockBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

interface ProductTableProps {
  products: ProductDTO[];
  onEdit: (product: ProductDTO) => void;
  onViewLabel: (product: ProductDTO) => void;
  onDelete?: (product: ProductDTO) => void;
}

export function ProductTable({ products, onEdit, onViewLabel, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="p-8 text-center bg-white">
        <EmptyState title="No products found" description="Add a product or import a CSV to get started." />
      </div>
    );
  }

  return (
    <div>
      {/* 1. Desktop & Tablet Table (hidden on sm/mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Barcode</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Cost</TableHeaderCell>
              <TableHeaderCell>Price</TableHeaderCell>
              <TableHeaderCell>Stock</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-semibold text-foreground">{product.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted">{product.barcode}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                <TableCell className="font-bold text-foreground">{formatCurrency(product.sellingPrice)}</TableCell>
                <TableCell>
                  <StockBadge stockQty={product.stockQty} lowStockAlert={product.lowStockAlert} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(product)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onViewLabel(product)}>
                      Label
                    </Button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        title="Delete Product"
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 2. Mobile Responsive Card List (md:hidden) */}
      <div className="md:hidden flex flex-col divide-y divide-border bg-white">
        {products.map((product) => (
          <div key={product.id} className="p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                    {product.barcode}
                  </span>
                  <span className="text-xs text-muted">{product.category}</span>
                </div>
              </div>
              <StockBadge stockQty={product.stockQty} lowStockAlert={product.lowStockAlert} />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <div>
                <span className="text-muted">Price: </span>
                <strong className="text-sm text-foreground">{formatCurrency(product.sellingPrice)}</strong>
                <span className="text-muted text-[11px] ml-1.5">(Cost: {formatCurrency(product.costPrice)})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="px-2.5 py-1 rounded-md border border-border bg-slate-50 font-semibold text-slate-700 hover:bg-slate-100 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onViewLabel(product)}
                  className="px-2.5 py-1 rounded-md border border-border bg-slate-50 font-semibold text-slate-700 hover:bg-slate-100 text-xs cursor-pointer"
                >
                  Label
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(product)}
                    className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 font-semibold text-red-600 hover:bg-red-100 text-xs cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
