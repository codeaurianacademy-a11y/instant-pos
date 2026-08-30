import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api-error";

export interface CartLineInput {
  productId: string;
  quantity: number;
  lineDiscount?: number;
}

export interface SaveDraftInput {
  saleId?: string; // present when updating an existing draft
  customerName?: string;
  customerPhone?: string;
  items: CartLineInput[];
  discountTotal?: number;
  taxTotal?: number;
  cashierId: string;
}

export interface CompleteSaleInput {
  saleId?: string; // present when completing an existing draft
  customerName?: string;
  customerPhone?: string;
  items: CartLineInput[];
  discountTotal?: number;
  taxTotal?: number;
  paymentMethod: "CASH" | "CARD" | "UPI" | "OTHER";
  amountPaid: number;
  cashierId: string;
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  name?: string,
  phone?: string
): Promise<string | null> {
  if (!phone) return null;

  const trimmedPhone = phone.trim();
  const trimmedName = name?.trim() || "Walk-in";

  const customer = await tx.customer.upsert({
    where: { phone: trimmedPhone },
    update: { name: trimmedName },
    create: { name: trimmedName, phone: trimmedPhone },
  });

  return customer.id;
}

async function computeLineItems(tx: Prisma.TransactionClient, items: CartLineInput[]) {
  if (items.length === 0) {
    throw new ApiError("Cart is empty", 400);
  }

  const productIds = items.map((item) => item.productId);
  const products = await tx.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const lineItems: Prisma.SaleItemCreateManySaleInput[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      throw new ApiError(`Product not found: ${item.productId}`, 404);
    }
    if (item.quantity <= 0) {
      throw new ApiError(`Invalid quantity for ${product.name}`, 400);
    }

    const unitPrice = Number(product.sellingPrice);
    const lineDiscount = item.lineDiscount ?? 0;
    const lineTotal = unitPrice * item.quantity - lineDiscount;

    subtotal += lineTotal;

    lineItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      lineDiscount,
      lineTotal,
    });
  }

  return { lineItems, subtotal, productMap };
}

export async function saveDraft(input: SaveDraftInput) {
  return prisma.$transaction(async (tx) => {
    const { lineItems, subtotal } = await computeLineItems(tx, input.items);
    const customerId = await resolveCustomer(tx, input.customerName, input.customerPhone);

    const discountTotal = input.discountTotal ?? 0;
    const taxTotal = input.taxTotal ?? 0;
    const grandTotal = subtotal - discountTotal + taxTotal;

    if (input.saleId) {
      const existing = await tx.sale.findUnique({ where: { id: input.saleId } });
      if (!existing || existing.status !== "DRAFT") {
        throw new ApiError("Draft not found", 404);
      }

      await tx.saleItem.deleteMany({ where: { saleId: input.saleId } });

      return tx.sale.update({
        where: { id: input.saleId },
        data: {
          customerId,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          items: { createMany: { data: lineItems } },
        },
        include: { items: true },
      });
    }

    return tx.sale.create({
      data: {
        status: "DRAFT",
        customerId,
        cashierId: input.cashierId,
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        items: { createMany: { data: lineItems } },
      },
      include: { items: true },
    });
  });
}

export async function completeSale(input: CompleteSaleInput) {
  return prisma.$transaction(async (tx) => {
    const { lineItems, subtotal, productMap } = await computeLineItems(tx, input.items);
    const customerId = await resolveCustomer(tx, input.customerName, input.customerPhone);

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (product.stockQty < item.quantity) {
        throw new ApiError(`Not enough stock for ${product.name} (have ${product.stockQty})`, 409);
      }
    }

    const discountTotal = input.discountTotal ?? 0;
    const taxTotal = input.taxTotal ?? 0;
    const grandTotal = subtotal - discountTotal + taxTotal;

    if (input.amountPaid < grandTotal) {
      throw new ApiError("Amount paid is less than the total due", 400);
    }

    let sale;
    if (input.saleId) {
      const existing = await tx.sale.findUnique({ where: { id: input.saleId } });
      if (!existing || existing.status !== "DRAFT") {
        throw new ApiError("Draft not found", 404);
      }
      await tx.saleItem.deleteMany({ where: { saleId: input.saleId } });
      sale = await tx.sale.update({
        where: { id: input.saleId },
        data: {
          status: "COMPLETED",
          customerId,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          paymentMethod: input.paymentMethod,
          amountPaid: input.amountPaid,
          completedAt: new Date(),
          items: { createMany: { data: lineItems } },
        },
        include: { items: true },
      });
    } else {
      sale = await tx.sale.create({
        data: {
          status: "COMPLETED",
          type: "SALE",
          customerId,
          cashierId: input.cashierId,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          paymentMethod: input.paymentMethod,
          amountPaid: input.amountPaid,
          completedAt: new Date(),
          items: { createMany: { data: lineItems } },
        },
        include: { items: true },
      });
    }

    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          saleId: sale.id,
        },
      });
    }

    return sale;
  });
}

export async function listDrafts(cashierId?: string) {
  return prisma.sale.findMany({
    where: { status: "DRAFT", ...(cashierId ? { cashierId } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, barcode: true } } } },
    },
  });
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      cashier: { select: { name: true } },
      items: { include: { product: { select: { name: true, barcode: true } } } },
      originalSale: { select: { id: true, billNumber: true } },
      exchangedInto: { select: { id: true, billNumber: true } },
    },
  });

  if (!sale) {
    throw new ApiError("Sale not found", 404);
  }

  return sale;
}

export async function voidSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale || sale.status !== "COMPLETED") {
    throw new ApiError("Only completed sales can be voided", 400);
  }

  return prisma.$transaction(async (tx) => {
    const items = await tx.saleItem.findMany({ where: { saleId: id } });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantity: item.quantity,
          saleId: id,
          note: "Sale voided — stock restored",
        },
      });
    }

    return tx.sale.update({ where: { id }, data: { status: "VOIDED" } });
  });
}
