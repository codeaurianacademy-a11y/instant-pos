"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ScannerInput } from "@/components/sales/ScannerInput";
import { CartPanel } from "@/components/sales/CartPanel";
import { ExchangeReturnPanel, type ReturnableItem } from "@/components/sales/ExchangeReturnPanel";
import { addProductToCart, updateCartQuantity, removeFromCart, type CartLine } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

interface ExchangeFormProps {
  originalSaleId: string;
  originalBillNumber: string;
  returnableItems: ReturnableItem[];
}

type PaymentMethod = "CASH" | "CARD" | "UPI" | "OTHER";

export function ExchangeForm({ originalSaleId, originalBillNumber, returnableItems }: ExchangeFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(returnableItems.map((item) => [item.productId, item.maxQuantity]))
  );
  const [newItemsCart, setNewItemsCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnedTotal = useMemo(() => {
    return returnableItems.reduce((sum, item) => {
      const qty = returnQuantities[item.productId] ?? 0;
      return sum + Number(item.unitPrice) * qty;
    }, 0);
  }, [returnableItems, returnQuantities]);

  const newItemsTotal = useMemo(() => {
    return newItemsCart.reduce((sum, line) => sum + Number(line.product.sellingPrice) * line.quantity, 0);
  }, [newItemsCart]);

  const balance = newItemsTotal - returnedTotal;

  function handleReturnQuantityChange(productId: string, quantity: number) {
    setReturnQuantities((prev) => ({ ...prev, [productId]: quantity }));
  }

  const [productCache, setProductCache] = useState<Map<string, ProductDTO>>(new Map());

  // ⚡ Pre-fetch active inventory in background on load for instant (0ms) scanning
  useEffect(() => {
    let isMounted = true;
    async function preloadProducts() {
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
        // silent fallback
      }
    }
    preloadProducts();
    return () => { isMounted = false; };
  }, []);

  async function handleScan(code: string) {
    if (isScanning) return;
    const cleanCode = code.trim().toUpperCase();

    // ⚡ 1. Check client-side instant cache
    const cached = productCache.get(cleanCode);
    if (cached) {
      if (cached.stockQty <= 0) {
        showToast(`${cached.name} is out of stock`, "danger");
        return;
      }
      setNewItemsCart((prev) => addProductToCart(prev, cached));
      return;
    }

    // 🌐 2. Network Fallback
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
      setNewItemsCart((prev) => addProductToCart(prev, product));
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSubmit() {
    const returnedItems = returnableItems
      .map((item) => ({ productId: item.productId, quantity: returnQuantities[item.productId] ?? 0 }))
      .filter((item) => item.quantity > 0);

    const newItems = newItemsCart.map((line) => ({ productId: line.product.id, quantity: line.quantity }));

    if (returnedItems.length === 0 && newItems.length === 0) {
      showToast("Select at least one item to return or add a new item", "danger");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalSaleId, returnedItems, newItems, paymentMethod }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Exchange failed", "danger");
        return;
      }

      showToast(isExchange ? "Exchange completed" : "Return completed", "success");
      router.push(`/sales/${data.exchange.id}`);
    } catch {
      showToast("Something went wrong. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isExchange = newItemsCart.length > 0;
  const mode = isExchange ? "Return & Exchange" : "Return";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{mode}</h1>
        <p className="text-sm text-muted">Against bill {originalBillNumber}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items to return</CardTitle>
        </CardHeader>
        <CardContent>
          <ExchangeReturnPanel
            items={returnableItems}
            returnQuantities={returnQuantities}
            onChange={handleReturnQuantityChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New items {!isExchange && <span className="text-xs font-normal text-muted ml-1">(optional — scan to exchange)</span>}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ScannerInput onScan={handleScan} disabled={isScanning} />
          <CartPanel
            cart={newItemsCart}
            onQuantityChange={(productId, qty) => setNewItemsCart((prev) => updateCartQuantity(prev, productId, qty))}
            onRemove={(productId) => setNewItemsCart((prev) => removeFromCart(prev, productId))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Returned value</span>
            <span>-{formatCurrency(returnedTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">New items value</span>
            <span>{formatCurrency(newItemsTotal)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
            <span>{balance >= 0 ? "Balance due" : "Refund due"}</span>
            <span>{formatCurrency(Math.abs(balance))}</span>
          </div>

          {balance > 0 && (
            <Select
              label="Payment method"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val as PaymentMethod)}
              options={[
                { label: "Cash", value: "CASH" },
                { label: "Card", value: "CARD" },
                { label: "UPI", value: "UPI" },
                { label: "Other", value: "OTHER" },
              ]}
            />
          )}

          <Button size="lg" onClick={handleSubmit} isLoading={isSubmitting}>
            Complete {mode}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
