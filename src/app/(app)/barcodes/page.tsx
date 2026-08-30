"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ProductLabel, type LabelSize } from "@/components/barcodes/ProductLabel";
import { ProductLabelSheet, type LabelEntry } from "@/components/barcodes/ProductLabelSheet";
import { formatCurrency } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

const LABEL_SIZES: { key: LabelSize; label: string; desc: string; sheetCount: string }[] = [
  { key: "48x24", label: "48 × 24 mm", desc: "NovaJet A4 Sheet", sheetCount: "48 / sheet" },
  { key: "45x21", label: "45 × 21 mm", desc: "Standard 4-Column", sheetCount: "48 / sheet" },
  { key: "38x21", label: "38 × 21 mm", desc: "Compact 5-Column", sheetCount: "65 / sheet" },
  { key: "64x34", label: "64 × 34 mm", desc: "Medium 3-Column", sheetCount: "24 / sheet" },
  { key: "100x44", label: "100 × 44 mm", desc: "Large 2-Column", sheetCount: "12 / sheet" },
];

export default function BarcodesPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [labelSize, setLabelSize] = useState<LabelSize>("48x24");
  const [queue, setQueue] = useState<Record<string, { product: ProductDTO; qty: number }>>({});

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data.products ?? []);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const queueList = Object.values(queue);
  const totalLabels = queueList.reduce((sum, item) => sum + item.qty, 0);

  function addToQueue(p: ProductDTO) {
    setQueue((prev) => {
      const existing = prev[p.id];
      if (existing) {
        return { ...prev, [p.id]: { ...existing, qty: existing.qty + 1 } };
      }
      return { ...prev, [p.id]: { product: p, qty: 1 } };
    });
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) {
      removeFromQueue(id);
    } else {
      setQueue((prev) => ({
        ...prev,
        [id]: { ...prev[id], qty },
      }));
    }
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function clearQueue() {
    setQueue({});
  }

  function printLabels() {
    if (totalLabels === 0) return;
    window.print();
  }

  const entries: LabelEntry[] = queueList.map((q) => ({
    product: q.product,
    qty: q.qty,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-48 sm:pb-36">
      {/* Header */}
      <div className="border-b border-border/80 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Barcode Labels & Sticker Printing</h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Select products, set print quantities, choose sticker dimensions, and batch print onto standard A4 sticker sheets.
        </p>
      </div>

      {/* Label Size Selector */}
      <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Sticker Dimensions & Layout</span>
          <span className="text-[11px] text-muted">A4 Paper Compatible</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {LABEL_SIZES.map((s) => {
            const isSelected = labelSize === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setLabelSize(s.key)}
                className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "border-accent bg-accent/5 ring-2 ring-accent shadow-xs"
                    : "border-border bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span className={`text-xs sm:text-sm font-bold ${isSelected ? "text-accent" : "text-foreground"}`}>
                  {s.label}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 leading-tight">{s.desc}</span>
                <span className="text-[10px] text-muted mt-1">{s.sheetCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Meta Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search products by title, barcode, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        <div className="text-xs font-medium text-muted">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Product Selection Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
          <p className="text-sm font-medium text-foreground">No matching products found</p>
          <p className="text-xs text-muted mt-1">Try adjusting your search query or add new inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredProducts.map((product) => {
            const inQueue = !!queue[product.id];
            const currentQty = queue[product.id]?.qty ?? 0;
            return (
              <div
                key={product.id}
                onClick={() => addToQueue(product)}
                className={`group flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 transition-all duration-150 cursor-pointer ${
                  inQueue
                    ? "border-accent bg-blue-50/30 shadow-xs ring-1 ring-accent"
                    : "border-border bg-white hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-muted truncate">{product.barcode}</span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        inQueue ? "bg-accent text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {inQueue ? `In queue (${currentQty})` : "+ Tap to add"}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {product.category} • <span className="font-semibold text-foreground">{formatCurrency(product.sellingPrice)}</span>
                  </p>
                </div>

                {/* Live Sticker Preview */}
                <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-center bg-slate-50/70 p-2 rounded-lg overflow-hidden">
                  <div className="transform scale-90 origin-center">
                    <ProductLabel product={product} size={labelSize} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating / Sticky Print Queue Bar (Mobile optimized position) */}
      {queueList.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-2 right-2 sm:left-6 sm:right-6 lg:left-72 max-w-5xl mx-auto z-40 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-accent text-white shrink-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-foreground block leading-tight">Print Queue</span>
                <span className="text-[11px] text-muted">
                  {queueList.length} items • <strong className="text-accent">{totalLabels} stickers</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                type="button"
                onClick={clearQueue}
                className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Clear
              </button>
              <Button size="md" onClick={printLabels} className="font-semibold shadow-xs text-xs sm:text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print {totalLabels} Label{totalLabels > 1 ? "s" : ""}
              </Button>
            </div>
          </div>

          {/* Queue Item List */}
          <div className="max-h-32 sm:max-h-40 overflow-y-auto divide-y divide-border pr-1 flex flex-col gap-1">
            {queueList.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between py-1 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{item.product.name}</p>
                  <p className="text-[10px] font-mono text-muted">{item.product.barcode}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQty(item.product.id, item.qty - 1)}
                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border border-border bg-slate-50 text-slate-700 hover:bg-slate-200 font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) setQty(item.product.id, val);
                    }}
                    className="h-6 w-10 sm:h-7 sm:w-12 rounded-lg border border-border text-center text-xs font-bold focus:ring-1 focus:ring-accent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQty(item.product.id, item.qty + 1)}
                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border border-border bg-slate-50 text-slate-700 hover:bg-slate-200 font-bold text-xs"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.product.id)}
                    title="Remove"
                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Print Container for High-Precision Printing */}
      {totalLabels > 0 && (
        <div className="hidden-print-container" aria-hidden>
          <ProductLabelSheet entries={entries} size={labelSize} />
        </div>
      )}

      <style jsx global>{`
        .hidden-print-container {
          position: absolute;
          left: -9999px;
          top: 0;
          width: 0;
          height: 0;
          overflow: hidden;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }

          body * {
            visibility: hidden;
          }

          .hidden-print-container,
          .hidden-print-container *,
          #product-label-print-root,
          #product-label-print-root * {
            visibility: visible;
          }

          .hidden-print-container {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
          }

          #product-label-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff;
          }
        }
      `}</style>
    </div>
  );
}
