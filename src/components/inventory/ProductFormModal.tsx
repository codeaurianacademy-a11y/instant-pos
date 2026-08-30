"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ProductDTO } from "@/lib/types";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: ProductDTO | null;
}

interface FormState {
  name: string;
  barcode: string;
  category: string;
  costPrice: string;
  sellingPrice: string;
  stockQty: string;
  lowStockAlert: string;
}

const emptyForm: FormState = {
  name: "",
  barcode: "",
  category: "",
  costPrice: "",
  sellingPrice: "",
  stockQty: "0",
  lowStockAlert: "5",
};

function ProductFormContent({
  product,
  onClose,
  onSaved,
}: {
  product: ProductDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const isEditing = product !== null;

  const [form, setForm] = useState<FormState>(() =>
    product
      ? {
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          stockQty: String(product.stockQty),
          lowStockAlert: String(product.lowStockAlert),
        }
      : emptyForm
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.category.trim()) nextErrors.category = "Category is required";
    if (form.costPrice === "" || Number(form.costPrice) < 0) nextErrors.costPrice = "Enter a valid cost";
    if (form.sellingPrice === "" || Number(form.sellingPrice) < 0)
      nextErrors.sellingPrice = "Enter a valid price";
    if (!isEditing && (form.stockQty === "" || Number(form.stockQty) < 0))
      nextErrors.stockQty = "Enter a valid stock quantity";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = isEditing
        ? await fetch(`/api/products/${product!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name.trim(),
              category: form.category.trim(),
              costPrice: Number(form.costPrice),
              sellingPrice: Number(form.sellingPrice),
              lowStockAlert: Number(form.lowStockAlert),
            }),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name.trim(),
              barcode: form.barcode.trim() || undefined,
              category: form.category.trim(),
              costPrice: Number(form.costPrice),
              sellingPrice: Number(form.sellingPrice),
              stockQty: Number(form.stockQty),
              lowStockAlert: Number(form.lowStockAlert),
            }),
          });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Failed to save product", "danger");
        return;
      }

      showToast(isEditing ? "Product updated" : "Product created", "success");
      onSaved();
      onClose();
    } catch {
      showToast("Something went wrong. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Product Name"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        error={errors.name}
        required
        autoFocus
      />
      <Input
        label="Barcode"
        value={form.barcode}
        onChange={(e) => updateField("barcode", e.target.value)}
        placeholder={isEditing ? undefined : "Leave blank to auto-generate"}
        disabled={isEditing}
        error={errors.barcode}
      />
      <Input
        label="Category"
        value={form.category}
        onChange={(e) => updateField("category", e.target.value)}
        error={errors.category}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Cost Price"
          type="number"
          step="0.01"
          min="0"
          value={form.costPrice}
          onChange={(e) => updateField("costPrice", e.target.value)}
          error={errors.costPrice}
          required
        />
        <Input
          label="Selling Price"
          type="number"
          step="0.01"
          min="0"
          value={form.sellingPrice}
          onChange={(e) => updateField("sellingPrice", e.target.value)}
          error={errors.sellingPrice}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {!isEditing && (
          <Input
            label="Initial Stock"
            type="number"
            min="0"
            value={form.stockQty}
            onChange={(e) => updateField("stockQty", e.target.value)}
            error={errors.stockQty}
            required
          />
        )}
        <Input
          label="Low Stock Alert"
          type="number"
          min="0"
          value={form.lowStockAlert}
          onChange={(e) => updateField("lowStockAlert", e.target.value)}
          error={errors.lowStockAlert}
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

export function ProductFormModal({ open, onClose, onSaved, product }: ProductFormModalProps) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit Product" : "Add Product"}>
      <ProductFormContent
        key={product?.id ?? "new"}
        product={product}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
