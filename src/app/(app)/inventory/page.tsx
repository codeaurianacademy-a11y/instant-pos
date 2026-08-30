"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    const timeout = setTimeout(() => fetchProducts(search), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchProducts]);

  function openAddModal() {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

  function openEditModal(product: ProductDTO) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted">Manage products, pricing, and stock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => (window.location.href = "/api/products/export")}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={openAddModal}>Add product</Button>
        </div>
      </div>

      <Input
        placeholder="Search by name or barcode…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <ProductTable products={products} onEdit={openEditModal} onViewLabel={setLabelProduct} />
      )}

      <ProductFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => fetchProducts(search)}
        product={editingProduct}
      />

      <ImportCsvModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => fetchProducts(search)}
      />

      <BarcodeLabelModal
        open={labelProduct !== null}
        onClose={() => setLabelProduct(null)}
        product={labelProduct}
      />
    </div>
  );
}
