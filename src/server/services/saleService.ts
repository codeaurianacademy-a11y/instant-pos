import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api-error";

export interface CartLineInput {
  productId: string;
  quantity: number;
  lineDiscount?: number;
}

export interface SaveDraftInput {
  saleId?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartLineInput[];
  discountTotal?: number;
  taxTotal?: number;
  cashierId: string;
}

export interface CompleteSaleInput {
  saleId?: string;
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
  const trimmedPhone = phone?.trim();
  const trimmedName = name?.trim();

  if (!trimmedPhone && !trimmedName) return null;

  if (trimmedPhone) {
    const customer = await tx.customer.upsert({
      where: { phone: trimmedPhone },
      update: trimmedName ? { name: trimmedName } : {},
      create: { name: trimmedName || "Customer", phone: trimmedPhone },
    });
    return customer.id;
  }

  if (trimmedName) {
    const generatedPhone = `phone_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const customer = await tx.customer.create({
      data: { name: trimmedName, phone: generatedPhone },
    });
    return customer.id;
  }

  return null;
}

async function computeLineItems(tx: Prisma.TransactionClient, items: CartLineInput[]) {
  if (items.length === 0) {
    throw new ApiError("Cart is empty", 400);
  }

  const productIds = items.map((item) => item.productId);
  const products = await tx.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const lineItems: {
    productId: string;
    quantity: number;
    unitPrice: number;
    lineDiscount: number;
    lineTotal: number;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      throw new ApiError(`Product not found: ${item.productId}`, 404);
    }

    const unitPrice = Number(product.sellingPrice);
    const lineDiscount = item.lineDiscount ?? 0;
    const lineTotal = unitPrice * item.quantity - lineDiscount;

    subtotal += lineTotal;
    lineItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineDiscount,
      lineTotal,
    });
  }

  return { lineItems, subtotal, productMap };
}

export async function saveDraftSale(input: SaveDraftInput) {
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
      await tx.saleItem.createMany({
        data: lineItems.map((item) => ({
          saleId: input.saleId!,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineDiscount: item.lineDiscount,
          lineTotal: item.lineTotal,
        })),
      });
      return tx.sale.update({
        where: { id: input.saleId },
        data: {
          customerId,
          cashierId: input.cashierId,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
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

// Export both saveDraft and saveDraftSale for API route compatibility
export const saveDraft = saveDraftSale;

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
    } else {
      sale = await tx.sale.create({
        data: {
          status: "COMPLETED",
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
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              category: true,
              costPrice: true,
              sellingPrice: true,
              stockQty: true,
            },
          },
        },
      },
    },
  });
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      cashier: { select: { name: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              category: true,
              costPrice: true,
              sellingPrice: true,
              stockQty: true,
            },
          },
        },
      },
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

export interface EditSaleInput {
  saleId: string;
  customerName?: string;
  customerPhone?: string;
  items: CartLineInput[];
  discountTotal?: number;
  taxTotal?: number;
  paymentMethod?: "CASH" | "CARD" | "UPI" | "OTHER";
  amountPaid?: number;
  adminId: string;
  adminName: string;
  userRole?: string;
}

export async function editSale(input: EditSaleInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.sale.findUnique({
      where: { id: input.saleId },
      include: {
        customer: true,
        exchangedInto: { select: { id: true, billNumber: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                costPrice: true,
                sellingPrice: true,
                stockQty: true,
              },
            },
          },
        },
      },
    });

    if (!existing || existing.status !== "COMPLETED") {
      throw new ApiError("Only completed sales can be edited", 400);
    }

    if (existing.exchangedInto) {
      throw new ApiError("Cannot edit a sale that has already been returned or exchanged", 400);
    }

    // Cashier can only edit their own transactions; Admin can edit any transaction
    if (input.userRole && input.userRole !== "ADMIN" && existing.cashierId !== input.adminId) {
      throw new ApiError("You can only edit transactions created by you", 403);
    }

    // 1. Snapshot previous state
    const previousSnapshot = {
      editedAt: new Date().toISOString(),
      editedBy: input.adminName,
      previousGrandTotal: Number(existing.grandTotal),
      previousDiscountTotal: Number(existing.discountTotal),
      previousTaxTotal: Number(existing.taxTotal),
      previousSubtotal: Number(existing.subtotal),
      previousPaymentMethod: existing.paymentMethod,
      previousAmountPaid: existing.amountPaid ? Number(existing.amountPaid) : null,
      previousCustomer: existing.customer ? { name: existing.customer.name, phone: existing.customer.phone } : null,
      previousItems: existing.items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        barcode: i.product.barcode,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        lineDiscount: Number(i.lineDiscount),
        lineTotal: Number(i.lineTotal),
      })),
    };

    const existingHistory = Array.isArray(existing.editHistory)
      ? (existing.editHistory as unknown as object[])
      : [];
    const updatedHistory = [...existingHistory, previousSnapshot];

    // 2. Restore previous stock
    for (const oldItem of existing.items) {
      await tx.product.update({
        where: { id: oldItem.productId },
        data: { stockQty: { increment: oldItem.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: oldItem.productId,
          type: "MANUAL_ADJUSTMENT",
          quantity: oldItem.quantity,
          saleId: existing.id,
          note: `Bill #${existing.billNumber} edit: restock previous quantity (+${oldItem.quantity})`,
          performedByAdminId: input.adminId,
        },
      });
    }

    // 3. Compute new line items & check new stock
    const { lineItems, subtotal, productMap } = await computeLineItems(tx, input.items);
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (product.stockQty < item.quantity) {
        throw new ApiError(`Not enough stock for ${product.name} (available ${product.stockQty})`, 409);
      }
    }

    // 4. Deduct new stock
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
          saleId: existing.id,
          note: `Bill #${existing.billNumber} edit: deducted new quantity (-${item.quantity})`,
          performedByAdminId: input.adminId,
        },
      });
    }

    // 5. Delete old saleItems and insert new ones
    await tx.saleItem.deleteMany({ where: { saleId: existing.id } });
    await tx.saleItem.createMany({
      data: lineItems.map((item) => ({
        saleId: existing.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineDiscount: item.lineDiscount,
        lineTotal: item.lineTotal,
      })),
    });

    const customerId = await resolveCustomer(tx, input.customerName, input.customerPhone);
    const discountTotal = input.discountTotal ?? 0;
    const taxTotal = input.taxTotal ?? 0;
    const grandTotal = subtotal - discountTotal + taxTotal;
    const paymentMethod = input.paymentMethod ?? existing.paymentMethod;
    const amountPaid = input.amountPaid !== undefined ? input.amountPaid : grandTotal;

    const updatedSale = await tx.sale.update({
      where: { id: existing.id },
      data: {
        ...(customerId
          ? { customer: { connect: { id: customerId } } }
          : existing.customerId
          ? { customer: { connect: { id: existing.customerId } } }
          : {}),
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        paymentMethod,
        amountPaid,
        isEdited: true,
        editHistory: updatedHistory,
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        cashier: { select: { name: true } },
      },
    });

    return updatedSale;
  });
}

// Permanently delete a sale (admin only).
// If sale was COMPLETED, stock is restored first.
export async function deleteSale(id: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      throw new ApiError("Sale not found", 404);
    }

    // Restore stock for completed sales
    if (sale.status === "COMPLETED") {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
    }

    // Delete stock movements linked to this sale
    await tx.stockMovement.deleteMany({ where: { saleId: id } });
    // SaleItems cascade-delete via schema onDelete: Cascade
    await tx.sale.delete({ where: { id } });

    return { id };
  });
}
