"use client";

import { useEffect, useState, type FormEvent } from "react";
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

export function ProductFormModal({ open, onClose, onSaved, product }: ProductFormModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = product !== null;

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        barcode: product.barcode,
        category: product.category,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQty: String(product.stockQty),
        lowStockAlert: String(product.lowStockAlert),
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [open, product]);

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
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit product" : "Add product"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          error={errors.name}
          autoFocus
        />
        <Input
          label={isEditing ? "Barcode" : "Barcode (leave blank to auto-generate)"}
          value={form.barcode}
          onChange={(e) => updateField("barcode", e.target.value)}
          disabled={isEditing}
        />
        <Input
          label="Category"
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
          error={errors.category}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Cost price"
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={(e) => updateField("costPrice", e.target.value)}
            error={errors.costPrice}
          />
          <Input
            label="Selling price"
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={(e) => updateField("sellingPrice", e.target.value)}
            error={errors.sellingPrice}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Stock quantity"
            type="number"
            min="0"
            step="1"
            value={form.stockQty}
            onChange={(e) => updateField("stockQty", e.target.value)}
            error={errors.stockQty}
            disabled={isEditing}
          />
          <Input
            label="Low stock alert"
            type="number"
            min="0"
            step="1"
            value={form.lowStockAlert}
            onChange={(e) => updateField("lowStockAlert", e.target.value)}
          />
        </div>
        {isEditing && (
          <p className="text-xs text-muted -mt-2">
            Barcode and stock quantity can&apos;t be edited here — use stock adjustment for stock changes.
          </p>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
