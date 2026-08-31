"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { ScannerInput } from "@/components/sales/ScannerInput";
import { CartPanel } from "@/components/sales/CartPanel";
import { addProductToCart, updateCartQuantity, removeFromCart, type CartLine } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

interface EditSaleFormProps {
  saleId: string;
  billNumber: string;
  initialCustomerName: string;
  initialCustomerPhone: string;
  initialDiscountTotal: number;
  initialTaxTotal: number;
  initialPaymentMethod: string;
  initialItems: CartLine[];
  originalGrandTotal: number;
}

export function EditSaleForm({
  saleId,
  billNumber,
  initialCustomerName,
  initialCustomerPhone,
  initialDiscountTotal,
  initialTaxTotal,
  initialPaymentMethod,
  initialItems,
  originalGrandTotal,
}: EditSaleFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [cart, setCart] = useState<CartLine[]>(initialItems);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [discountStr, setDiscountStr] = useState(
    initialDiscountTotal > 0 ? String(initialDiscountTotal) : ""
  );
  const [taxStr, setTaxStr] = useState(
    initialTaxTotal > 0 ? String(initialTaxTotal) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // In-memory product cache for instant scanning
  const [productCache, setProductCache] = useState<Map<string, ProductDTO>>(new Map());

  useEffect(() => {
    let isMounted = true;
    async function preload() {
      try {
        const res = await fetch("/api/products");
        if (res.ok && isMounted) {
          const data = await res.json();
          const map = new Map<string, ProductDTO>();
          if (Array.isArray(data.products)) {
            data.products.forEach((p: ProductDTO) => {
              if (p.barcode) map.set(p.barcode.trim().toUpperCase(), p);
            });
          }
          setProductCache(map);
        }
      } catch {
        // silent
      }
    }
    preload();
    return () => { isMounted = false; };
  }, []);

  const discountTotal = useMemo(() => Math.max(0, parseFloat(discountStr) || 0), [discountStr]);
  const taxTotal = useMemo(() => Math.max(0, parseFloat(taxStr) || 0), [taxStr]);

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const lineTotal = Number(line.product.sellingPrice) * line.quantity - (line.lineDiscount || 0);
        return sum + Math.max(0, lineTotal);
      }, 0),
    [cart]
  );

  const grandTotal = useMemo(
    () => Math.max(0, subtotal - discountTotal + taxTotal),
    [subtotal, discountTotal, taxTotal]
  );

  const totalDifference = grandTotal - originalGrandTotal;

  async function handleScan(code: string) {
    if (isScanning) return;
    const cleanCode = code.trim().toUpperCase();

    const cached = productCache.get(cleanCode);
    if (cached) {
      if (cached.stockQty <= 0) {
        showToast(`${cached.name} is out of stock`, "danger");
        return;
      }
      setCart((prev) => addProductToCart(prev, cached));
      return;
    }

    setIsScanning(true);
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? `No product found for "${code}"`, "danger");
        return;
      }
      const product = data.product as ProductDTO;
      if (product.stockQty <= 0) {
        showToast(`${product.name} is out of stock`, "danger");
        return;
      }
      setProductCache((prev) => new Map(prev).set(cleanCode, product));
      setCart((prev) => addProductToCart(prev, product));
    } finally {
      setIsScanning(false);
    }
  }

  function handleQuantityChange(productId: string, quantity: number) {
    setCart((prev) => updateCartQuantity(prev, productId, quantity));
  }

  function handleRemove(productId: string) {
    setCart((prev) => removeFromCart(prev, productId));
  }

  async function handleSave() {
    if (cart.length === 0) {
      showToast("Cart cannot be empty", "danger");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            lineDiscount: line.lineDiscount || undefined,
          })),
          discountTotal: discountTotal > 0 ? discountTotal : undefined,
          taxTotal: taxTotal > 0 ? taxTotal : undefined,
          paymentMethod,
          amountPaid: grandTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to update bill", "danger");
        return;
      }

      showToast("Bill updated successfully with audit history", "success");
      router.push(`/sales/${saleId}`);
      router.refresh();
    } catch {
      showToast("Something went wrong while editing the bill", "danger");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              Editing Completed Bill
            </span>
            <span className="font-mono text-xs font-bold text-slate-600">
              #{billNumber.slice(-8).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Edit Bill & Reconcile Stock
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Modify items, quantities, customer details, or discounts. All changes will be saved to the permanent audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/sales/${saleId}`}>
            <Button variant="secondary" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || cart.length === 0}
            size="md"
            className="font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            {isSubmitting ? "Saving Changes..." : "Save Bill Changes"}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Scanner + Cart Items */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <ScannerInput onScan={handleScan} />

          <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Bill Items ({cart.length})
              </h2>
              <span className="text-xs text-muted">Adjust quantity, discount or remove items</span>
            </div>
            <CartPanel
              cart={cart}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />
          </div>
        </div>

        {/* Right Col: Customer, Totals & Comparison */}
        <div className="flex flex-col gap-5">
          {/* Customer & Payment Form */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              Customer & Payment
            </h3>
            <Input
              label="Customer Mobile No *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              required
            />
            <Input
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
            />
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as any)}
              options={[
                { label: "Cash", value: "CASH" },
                { label: "UPI", value: "UPI" },
                { label: "Card", value: "CARD" },
                { label: "Other", value: "OTHER" },
              ]}
            />
            <Input
              label="Overall Bill Discount (₹)"
              type="text"
              inputMode="decimal"
              value={discountStr}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d*$/.test(v)) setDiscountStr(v);
              }}
              placeholder="0"
            />
          </div>

          {/* Bill Comparison Card */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Bill Comparison
              </span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Live Diff
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Original Grand Total:</span>
              <strong className="text-slate-900 line-through">{formatCurrency(originalGrandTotal)}</strong>
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Updated Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-extrabold border-t border-amber-200/80 pt-2.5 mt-1">
              <span className="text-slate-900">New Net Total:</span>
              <span className="text-xl font-black text-amber-700">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="text-[11px] font-semibold text-center pt-2 border-t border-amber-200/60">
              {totalDifference > 0 ? (
                <span className="text-blue-700">
                  Customer pays additional {formatCurrency(totalDifference)}
                </span>
              ) : totalDifference < 0 ? (
                <span className="text-red-700">
                  Refund due to customer: {formatCurrency(Math.abs(totalDifference))}
                </span>
              ) : (
                <span className="text-slate-600">Total amount remains unchanged</span>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={isSubmitting || cart.length === 0}
              size="lg"
              className="mt-2 w-full font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              {isSubmitting ? "Saving Changes..." : "Confirm & Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
