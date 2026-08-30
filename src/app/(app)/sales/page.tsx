"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScannerInput } from "@/components/sales/ScannerInput";
import { CartPanel } from "@/components/sales/CartPanel";
import { BillSummary, type PaymentMethod } from "@/components/sales/BillSummary";
import { useToast } from "@/components/ui/Toast";
import {
  addProductToCart,
  updateCartQuantity,
  removeFromCart,
  cartSubtotal,
  type CartLine,
} from "@/lib/cart";
import type { ProductDTO } from "@/lib/types";

function SalesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const { showToast } = useToast();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId);

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const grandTotal = subtotal - discountTotal + taxTotal;

  useEffect(() => {
    if (!draftId) return;

    async function loadDraft() {
      setIsLoadingDraft(true);
      try {
        const res = await fetch(`/api/sales/${draftId}`);
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "Could not load draft", "danger");
          return;
        }

        const sale = data.sale;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadedCart: CartLine[] = (sale.items as any[]).map((item) => ({
          product: {
            id: item.product?.id || item.productId,
            name: item.product?.name || "Item",
            barcode: item.product?.barcode || "",
            category: item.product?.category || "General",
            costPrice: String(item.product?.costPrice || "0"),
            sellingPrice: String(item.unitPrice || item.product?.sellingPrice || "0"),
            stockQty: item.product?.stockQty ?? 100,
            lowStockAlert: item.product?.lowStockAlert ?? 5,
            attributes: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: item.quantity,
          lineDiscount: Number(item.lineDiscount || 0),
        }));

        setCart(loadedCart);
        setDiscountTotal(Number(sale.discountTotal || 0));
        setTaxTotal(Number(sale.taxTotal || 0));
        setCustomerName(sale.customer?.name ?? "");
        setCustomerPhone(
          sale.customer?.phone && !sale.customer.phone.startsWith("phone_")
            ? sale.customer.phone
            : ""
        );
      } finally {
        setIsLoadingDraft(false);
      }
    }

    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const [productCache, setProductCache] = useState<Map<string, ProductDTO>>(new Map());

  // ⚡ Pre-fetch active inventory in background on load for instant (0ms) barcode scanning
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
        // silent fallback to network scan
      }
    }
    preloadProducts();
    return () => { isMounted = false; };
  }, []);

  async function handleScan(code: string) {
    if (isScanning) return;
    const cleanCode = code.trim().toUpperCase();

    // ⚡ 1. Instant Cache Hit (0ms latency, zero server round-trip)
    const cached = productCache.get(cleanCode);
    if (cached) {
      if (cached.stockQty <= 0) {
        showToast(`${cached.name} is out of stock`, "danger");
        return;
      }
      setCart((prev) => addProductToCart(prev, cached));
      return;
    }

    // 🌐 2. Network Fallback (for newly created or uncached items)
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

  function buildItemsPayload() {
    return cart.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
      lineDiscount: line.lineDiscount || undefined,
    }));
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      showToast("Cart is empty", "danger");
      return;
    }

    if (!customerPhone || customerPhone.trim().length < 3) {
      showToast("Customer mobile number is required to generate bill", "danger");
      return;
    }

    const paid = Number(amountPaid);
    if (!amountPaid || paid < grandTotal) {
      showToast("Amount paid must cover the total due", "danger");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: draftId ?? undefined,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim(),
          items: buildItemsPayload(),
          discountTotal: discountTotal || undefined,
          taxTotal: taxTotal || undefined,
          paymentMethod,
          amountPaid: paid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Checkout failed", "danger");
        return;
      }

      showToast("Sale completed successfully", "success");
      router.push(`/sales/${data.sale.id}`);
    } catch {
      showToast("Something went wrong. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (cart.length === 0) {
      showToast("Cart is empty", "danger");
      return;
    }

    if (!customerPhone || customerPhone.trim().length < 3) {
      showToast("Customer mobile number is required to save draft order", "danger");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: draftId ?? undefined,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim(),
          items: buildItemsPayload(),
          discountTotal: discountTotal || undefined,
          taxTotal: taxTotal || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Could not save draft", "danger");
        return;
      }

      showToast("Draft saved", "success");
      router.push("/sales/drafts");
    } catch {
      showToast("Something went wrong. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">POS Checkout Terminal</h1>
          <p className="text-sm text-muted mt-0.5">
            {isLoadingDraft ? "Loading draft sale…" : "Scan barcode or search products to build cart."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main: Scanner & Cart (7 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-4">
          <ScannerInput onScan={handleScan} disabled={isScanning || isLoadingDraft} />
          <CartPanel cart={cart} onQuantityChange={handleQuantityChange} onRemove={handleRemove} />
        </div>

        {/* Right: Bill Summary (5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-5 sticky top-6">
          <BillSummary
            subtotal={subtotal}
            discountTotal={discountTotal}
            onDiscountChange={setDiscountTotal}
            taxTotal={taxTotal}
            onTaxChange={setTaxTotal}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            amountPaid={amountPaid}
            onAmountPaidChange={setAmountPaid}
            onCheckout={handleCheckout}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
            disabled={cart.length === 0 || isLoadingDraft}
          />
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={null}>
      <SalesPageContent />
    </Suspense>
  );
}
