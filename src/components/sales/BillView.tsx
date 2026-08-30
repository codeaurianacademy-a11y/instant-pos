"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface BillViewProps {
  sale: {
    id: string;
    billNumber: string;
    type: "SALE" | "EXCHANGE";
    status: "DRAFT" | "COMPLETED" | "VOIDED";
    subtotal: string;
    discountTotal: string;
    taxTotal: string;
    grandTotal: string;
    paymentMethod: string | null;
    amountPaid: string | null;
    completedAt: string | null;
    createdAt: string;
    customer: { name: string; phone: string } | null;
    cashier: { name: string };
    items: {
      id: string;
      quantity: number;
      unitPrice: string;
      lineDiscount: string;
      lineTotal: string;
      product: { name: string; barcode: string };
    }[];
    originalSale: { id: string; billNumber: string } | null;
    exchangedInto: { id: string; billNumber: string } | null;
  };
}

export function BillView({ sale }: BillViewProps) {
  const canExchange = sale.status === "COMPLETED" && sale.type === "SALE" && !sale.exchangedInto;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <div id="bill-print-area" className="mx-auto w-full max-w-md rounded-xl border border-border bg-white p-6">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Instant POS</h2>
          <p className="text-sm text-muted">Bill {sale.billNumber}</p>
          {sale.type === "EXCHANGE" && (
            <Badge tone="accent" className="mt-1">
              Exchange
            </Badge>
          )}
          {sale.status === "VOIDED" && (
            <Badge tone="danger" className="mt-1">
              Voided
            </Badge>
          )}
        </div>

        <div className="flex justify-between text-xs text-muted mb-3">
          <span>{formatDateTime(sale.completedAt ?? sale.createdAt)}</span>
          <span>Cashier: {sale.cashier.name}</span>
        </div>

        {sale.customer && (
          <p className="text-sm text-foreground mb-1">
            {sale.customer.name} • {sale.customer.phone}
          </p>
        )}

        {sale.originalSale && (
          <p className="text-xs text-muted mb-3 no-print">
            Exchange against{" "}
            <Link href={`/sales/${sale.originalSale.id}`} className="text-accent hover:underline">
              {sale.originalSale.billNumber}
            </Link>
          </p>
        )}
        {sale.exchangedInto && (
          <p className="text-xs text-muted mb-3 no-print">
            Exchanged via{" "}
            <Link href={`/sales/${sale.exchangedInto.id}`} className="text-accent hover:underline">
              {sale.exchangedInto.billNumber}
            </Link>
          </p>
        )}

        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-1.5">{item.product.name}</td>
                <td className="py-1.5 text-center">{item.quantity}</td>
                <td className="py-1.5 text-right">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-border pt-2 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {Number(sale.discountTotal) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Discount</span>
              <span>-{formatCurrency(sale.discountTotal)}</span>
            </div>
          )}
          {Number(sale.taxTotal) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Tax</span>
              <span>{formatCurrency(sale.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold border-t border-border pt-1 mt-1">
            <span>Total</span>
            <span>{formatCurrency(sale.grandTotal)}</span>
          </div>
          {sale.paymentMethod && (
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>Paid via {sale.paymentMethod}</span>
              {sale.amountPaid && <span>{formatCurrency(sale.amountPaid)}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2 no-print">
        <Button onClick={handlePrint}>Print bill</Button>
        {canExchange && (
          <Link href={`/sales/${sale.id}/exchange`}>
            <Button variant="secondary">Exchange</Button>
          </Link>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #bill-print-area,
          #bill-print-area * {
            visibility: visible;
          }
          #bill-print-area {
            position: fixed;
            top: 0;
            left: 0;
            border: none;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
