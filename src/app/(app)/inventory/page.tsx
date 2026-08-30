"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ProductTable } from "@/components/inventory/ProductTable";
import { ProductFormModal } from "@/components/inventory/ProductFormModal";
import { ImportCsvModal } from "@/components/inventory/ImportCsvModal";
import { BarcodeLabelModal } from "@/components/inventory/BarcodeLabelModal";
import type { ProductDTO } from "@/lib/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);
  const [labelProduct, setLabelProduct] = useState<ProductDTO | null>(null);

  const fetchProducts = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  function handleEdit(product: ProductDTO) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
  }

  function handleDownloadExport() {
    window.location.assign("/api/products/export");
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory & Products</h1>
          <p className="text-sm text-muted mt-0.5">Manage catalogue, pricing, barcodes, and current stock.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="md" onClick={handleDownloadExport}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </Button>
          <Button variant="secondary" size="md" onClick={() => setIsImportOpen(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import CSV
          </Button>
          <Button size="md" onClick={() => setIsFormOpen(true)} className="font-semibold shadow-xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Button>
        </div>
      </div>

      <div className="relative max-w-md w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          placeholder="Search by name, barcode, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
        />
      </div>

      <div className="rounded-xl border border-border bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <ProductTable
            products={products}
            onEdit={handleEdit}
            onViewLabel={(product) => setLabelProduct(product)}
          />
        )}
      </div>

      <ProductFormModal
        open={isFormOpen}
        onClose={handleCloseForm}
        onSaved={() => fetchProducts(search)}
        product={editingProduct}
      />

      <ImportCsvModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => fetchProducts(search)}
      />

      {labelProduct && (
        <BarcodeLabelModal
          open={!!labelProduct}
          onClose={() => setLabelProduct(null)}
          product={labelProduct}
        />
      )}
    </div>
  );
}
