"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

export type PaymentMethod = "CASH" | "CARD" | "UPI" | "OTHER";

interface BillSummaryProps {
  subtotal: number;
  discountTotal: number;
  onDiscountChange: (value: number) => void;
  taxTotal: number;
  onTaxChange: (value: number) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (value: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  amountPaid: string;
  onAmountPaidChange: (value: string) => void;
  onCheckout: () => void;
  onSaveDraft: () => void;
  isSubmitting: boolean;
  disabled: boolean;
}

export function BillSummary({
  subtotal,
  discountTotal,
  onDiscountChange,
  taxTotal,
  onTaxChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  paymentMethod,
  onPaymentMethodChange,
  amountPaid,
  onAmountPaidChange,
  onCheckout,
  onSaveDraft,
  isSubmitting,
  disabled,
}: BillSummaryProps) {
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
  const paid = Number(amountPaid) || 0;
  const changeDue = paid > grandTotal ? paid - grandTotal : 0;

  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="bg-slate-50/50 py-3.5 px-5">
        <CardTitle className="text-sm uppercase font-bold tracking-wider text-slate-700">Checkout & Bill Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Customer Information - Phone is Mandatory */}
        <div className="flex flex-col gap-2.5 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Customer Details</span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
              Mobile Number Required *
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Mobile Number *"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              placeholder="e.g. 9876543210"
              required
              className="h-9 text-xs font-semibold focus:ring-accent"
            />
            <Input
              label="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="h-9 text-xs"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            * Bills and draft orders are tracked by customer mobile number for instant identification and exchange.
          </p>
        </div>

        {/* Pricing Breakdown */}
        <div className="flex flex-col gap-2.5 border-t border-border pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Cart Subtotal</span>
            <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">Discount (₹)</span>
            <input
              type="text"
              inputMode="decimal"
              value={discountTotal || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d*$/.test(v)) onDiscountChange(parseFloat(v) || 0);
              }}
              className="w-28 rounded-md border border-border bg-white px-2.5 py-1 text-right text-sm font-medium focus:ring-1 focus:ring-accent focus:border-accent outline-none"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">Tax / GST (₹)</span>
            <input
              type="text"
              inputMode="decimal"
              value={taxTotal || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d*$/.test(v)) onTaxChange(parseFloat(v) || 0);
              }}
              className="w-28 rounded-md border border-border bg-white px-2.5 py-1 text-right text-sm font-medium focus:ring-1 focus:ring-accent focus:border-accent outline-none"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-border pt-3 mt-1 text-base font-bold text-foreground">
            <span>Grand Total</span>
            <span className="text-xl text-accent font-extrabold">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-3">
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(val) => onPaymentMethodChange(val as PaymentMethod)}
            options={[
              { label: "Cash", value: "CASH" },
              { label: "Card", value: "CARD" },
              { label: "UPI", value: "UPI" },
              { label: "Other", value: "OTHER" },
            ]}
          />
          <Input
            label="Amount Paid (₹)"
            type="text"
            inputMode="decimal"
            value={amountPaid}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d*$/.test(v)) onAmountPaidChange(v);
            }}
            placeholder={grandTotal > 0 ? String(grandTotal) : "0"}
          />
        </div>

        {paid > grandTotal && grandTotal > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-semibold">
            <span>Change to Return:</span>
            <span className="text-sm font-bold">{formatCurrency(changeDue)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          <Button size="lg" onClick={onCheckout} isLoading={isSubmitting} disabled={disabled} className="font-semibold shadow-xs">
            Complete & Print Bill
          </Button>
          <Button size="md" variant="secondary" onClick={onSaveDraft} disabled={disabled || isSubmitting}>
            Save as Draft Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
