// Client-side shape of Product as it comes back from the API — Prisma's Decimal
// fields are serialized to strings by JSON.stringify, not numbers, so this
// intentionally differs from the Prisma model type.
export interface ProductDTO {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: string;
  sellingPrice: string;
  stockQty: number;
  lowStockAlert: number;
  attributes: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
