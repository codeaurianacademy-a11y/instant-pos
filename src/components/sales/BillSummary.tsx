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
  const grandTotal = subtotal - discountTotal + taxTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Customer name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Walk-in"
          />
          <Input
            label="Phone number"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">Discount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountTotal || ""}
              onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
              className="w-24 rounded-md border border-border px-2 py-1 text-right text-sm"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">Tax</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxTotal || ""}
              onChange={(e) => onTaxChange(Number(e.target.value) || 0)}
              className="w-24 rounded-md border border-border px-2 py-1 text-right text-sm"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input
            label="Amount paid"
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={(e) => onAmountPaidChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button size="lg" onClick={onCheckout} isLoading={isSubmitting} disabled={disabled}>
            Complete sale
          </Button>
          <Button size="lg" variant="secondary" onClick={onSaveDraft} disabled={disabled || isSubmitting}>
            Save as draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
