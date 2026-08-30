import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api-error";
import { generateBarcode } from "@/lib/barcode";

export async function listProducts(params: { search?: string; category?: string }) {
  const { search, category } = params;

  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { barcode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductByBarcode(barcode: string) {
  const product = await prisma.product.findUnique({ where: { barcode } });
  if (!product || !product.isActive) {
    throw new ApiError("Product not found", 404);
  }
  return product;
}

export interface CreateProductInput {
  name: string;
  barcode?: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stockQty: number;
  lowStockAlert?: number;
  attributes?: Prisma.InputJsonValue;
  adminId: string;
}

export async function createProduct(input: CreateProductInput) {
  const barcode = input.barcode?.trim() || (await generateBarcode());

  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { barcode } });
    if (existing) {
      throw new ApiError(`Barcode "${barcode}" is already in use`, 409);
    }

    const product = await tx.product.create({
      data: {
        name: input.name,
        barcode,
        category: input.category,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        stockQty: input.stockQty,
        lowStockAlert: input.lowStockAlert ?? 5,
        attributes: input.attributes,
        updatedByAdminId: input.adminId,
      },
    });

    if (input.stockQty > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "IMPORT",
          quantity: input.stockQty,
          note: "Initial stock on product creation",
          performedByAdminId: input.adminId,
        },
      });
    }

    return product;
  });
}

export interface UpdateProductInput {
  id: string;
  name?: string;
  category?: string;
  costPrice?: number;
  sellingPrice?: number;
  lowStockAlert?: number;
  attributes?: Prisma.InputJsonValue;
  isActive?: boolean;
  adminId: string;
}

export async function updateProduct(input: UpdateProductInput) {
  const { id, adminId, ...fields } = input;

  return prisma.product.update({
    where: { id },
    data: { ...fields, updatedByAdminId: adminId },
  });
}

export interface StockAdjustmentInput {
  productId: string;
  quantityDelta: number;
  note?: string;
  adminId: string;
}

export async function adjustStock(input: StockAdjustmentInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: input.productId },
      data: { stockQty: { increment: input.quantityDelta } },
    });

    if (product.stockQty < 0) {
      throw new ApiError("Stock adjustment would result in negative stock", 400);
    }

    await tx.stockMovement.create({
      data: {
        productId: input.productId,
        type: "MANUAL_ADJUSTMENT",
        quantity: input.quantityDelta,
        note: input.note,
        performedByAdminId: input.adminId,
      },
    });

    return product;
  });
}
