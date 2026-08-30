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
  const canExchange = sale.status === "COMPLETED" && !sale.exchangedInto;

  function handlePrint() {
    window.print();
  }

  const shortBillNo = sale.billNumber.length > 10 
    ? `Bill #${sale.billNumber.slice(-8).toUpperCase()}` 
    : `Bill #${sale.billNumber}`;

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div id="bill-print-area" className="w-full rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-xs">
        <div className="text-center mb-5 pb-4 border-b border-border/80">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white font-bold mb-2 shadow-xs">
            POS
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Instant POS</h2>
          <p className="text-xs font-mono text-muted mt-0.5">{shortBillNo}</p>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            {sale.type === "EXCHANGE" && (
              <Badge tone={sale.items.length === 0 ? "danger" : "accent"}>
                {sale.items.length === 0 ? "Return Bill" : "Exchange Bill"}
              </Badge>
            )}
            {sale.status === "VOIDED" && <Badge tone="danger">Voided</Badge>}
            {sale.status === "COMPLETED" && sale.type !== "EXCHANGE" && (
              <Badge tone="success">Completed</Badge>
            )}
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted mb-4 bg-slate-50 p-2.5 rounded-lg">
          <span>{formatDateTime(sale.completedAt ?? sale.createdAt)}</span>
          <span className="font-semibold text-slate-700">Cashier: {sale.cashier.name}</span>
        </div>

        {sale.customer && (
          <div className="text-xs text-slate-600 mb-3 bg-slate-50/70 p-2.5 rounded-lg flex justify-between">
            <span>Customer: <strong>{sale.customer.name}</strong></span>
            {sale.customer.phone && !sale.customer.phone.startsWith("phone_") && (
              <span>Ph: <strong>{sale.customer.phone}</strong></span>
            )}
          </div>
        )}

        {sale.originalSale && (
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2.5 rounded-lg mb-3 no-print flex items-center justify-between">
            <span>{sale.items.length === 0 ? "Returned items from bill:" : "Exchange against original bill:"}</span>
            <Link href={`/sales/${sale.originalSale.id}`} className="font-bold underline hover:text-blue-900">
              #{sale.originalSale.billNumber.slice(-8).toUpperCase()}
            </Link>
          </div>
        )}

        {sale.exchangedInto && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mb-3 no-print flex items-center justify-between">
            <span>{sale.exchangedInto ? "Items returned/exchanged via bill:" : ""}  </span>
            <Link href={`/sales/${sale.exchangedInto.id}`} className="font-bold underline hover:text-amber-900">
              #{sale.exchangedInto.billNumber.slice(-8).toUpperCase()}
            </Link>
          </div>
        )}

        {/* Itemised table */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5">
                  <p className="font-semibold text-foreground leading-tight">{item.product.name}</p>
                  <span className="text-[11px] font-mono text-muted">{item.product.barcode}</span>
                </td>
                <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                <td className="py-2.5 text-right text-xs text-muted">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2.5 text-right font-bold text-foreground">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Breakdown */}
        <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">{formatCurrency(sale.subtotal)}</span>
          </div>
          {Number(sale.discountTotal) > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>{sale.type === "EXCHANGE" && sale.items.length === 0 ? "Items returned (Credit)" : sale.type === "EXCHANGE" ? "Returned items credit" : "Discount applied"}</span>
              <span>-{formatCurrency(sale.discountTotal)}</span>
            </div>
          )}
          {Number(sale.taxTotal) > 0 && (
            <div className="flex justify-between text-muted">
              <span>Tax</span>
              <span>{formatCurrency(sale.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-extrabold border-t border-border pt-2 mt-1 text-foreground">
            <span>Net Total</span>
            <span className="text-accent">{formatCurrency(sale.grandTotal)}</span>
          </div>
          {sale.paymentMethod && (
            <div className="flex justify-between text-xs text-muted mt-1 bg-slate-50 p-2 rounded-lg">
              <span>Payment Mode: <strong>{sale.paymentMethod}</strong></span>
              {sale.amountPaid && <span>Tendered: <strong>{formatCurrency(sale.amountPaid)}</strong></span>}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 no-print">
        <Button onClick={handlePrint} variant="secondary" size="lg" className="font-semibold gap-2 shadow-xs">
          <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Bill
        </Button>
        {canExchange && (
          <Link href={`/sales/${sale.id}/exchange`}>
            <Button size="lg" className="font-semibold gap-2 shadow-xs bg-accent text-white hover:bg-blue-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Exchange Items
            </Button>
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
            right: 0;
            margin: 0 auto;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
