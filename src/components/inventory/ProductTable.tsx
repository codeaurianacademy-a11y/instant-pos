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
}

export function ProductTable({ products, onEdit, onViewLabel }: ProductTableProps) {
  if (products.length === 0) {
    return <EmptyState title="No products found" description="Add a product or import a CSV to get started." />;
  }

  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>Product</TableHeaderCell>
          <TableHeaderCell>Barcode</TableHeaderCell>
          <TableHeaderCell>Category</TableHeaderCell>
          <TableHeaderCell>Cost</TableHeaderCell>
          <TableHeaderCell>Price</TableHeaderCell>
          <TableHeaderCell>Stock</TableHeaderCell>
          <TableHeaderCell />
        </tr>
      </TableHead>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell className="font-mono text-xs text-muted">{product.barcode}</TableCell>
            <TableCell>{product.category}</TableCell>
            <TableCell>{formatCurrency(product.costPrice)}</TableCell>
            <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
            <TableCell>
              <StockBadge stockQty={product.stockQty} lowStockAlert={product.lowStockAlert} />
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onViewLabel(product)}>
                  Label
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
