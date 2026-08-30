import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import type { CartLineInput } from "@/server/services/saleService";

export interface CreateExchangeInput {
  originalSaleId: string;
  returnedItems: CartLineInput[]; // items being returned from the original sale
  newItems: CartLineInput[]; // items the customer is taking instead
  paymentMethod: "CASH" | "CARD" | "UPI" | "OTHER";
  cashierId: string;
}

export async function createExchange(input: CreateExchangeInput) {
  return prisma.$transaction(async (tx) => {
    const originalSale = await tx.sale.findUnique({
      where: { id: input.originalSaleId },
      include: { items: true },
    });

    if (!originalSale || originalSale.status !== "COMPLETED") {
      throw new ApiError("Original sale not found or not completed", 404);
    }

    const alreadyExchanged = await tx.sale.findUnique({
      where: { originalSaleId: input.originalSaleId },
    });
    if (alreadyExchanged) {
      throw new ApiError("This sale has already been exchanged", 409);
    }

    if (input.returnedItems.length === 0 && input.newItems.length === 0) {
      throw new ApiError("Exchange must include at least one returned or new item", 400);
    }

    // Validate returned items belong to the original sale and quantities are sane
    for (const returned of input.returnedItems) {
      const originalLine = originalSale.items.find((i) => i.productId === returned.productId);
      if (!originalLine || returned.quantity > originalLine.quantity) {
        throw new ApiError("Returned item/quantity does not match the original sale", 400);
      }
    }

    // --- Calculate returned credit using what customer ACTUALLY PAID ---
    // The original sale may have a global discount applied.
    // We distribute it proportionally across line items.
    const saleSubtotal = Number(originalSale.subtotal);
    const saleGrandTotal = Number(originalSale.grandTotal);
    const discountRatio = saleSubtotal > 0 ? saleGrandTotal / saleSubtotal : 1;

    let returnedTotal = 0;
    for (const returned of input.returnedItems) {
      const originalLine = originalSale.items.find((i) => i.productId === returned.productId)!;
      // lineTotal already has per-line lineDiscount applied; now apply global discount ratio
      const effectiveLineTotal = Number(originalLine.lineTotal) * discountRatio;
      const effectiveUnitPrice = originalLine.quantity > 0 ? effectiveLineTotal / originalLine.quantity : 0;
      returnedTotal += effectiveUnitPrice * returned.quantity;
    }

    // --- Calculate new items total from current selling price ---
    const newProductIds = input.newItems.map((i) => i.productId);
    const returnedProductIds = input.returnedItems.map((i) => i.productId);
    const allProducts = await tx.product.findMany({
      where: { id: { in: [...new Set([...returnedProductIds, ...newProductIds])] } },
    });
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    let newTotal = 0;
    const newLineItems: {
      productId: string;
      quantity: number;
      unitPrice: number;
      lineDiscount: number;
      lineTotal: number;
    }[] = [];

    for (const newItem of input.newItems) {
      const product = productMap.get(newItem.productId);
      if (!product || !product.isActive) {
        throw new ApiError(`Product not found: ${newItem.productId}`, 404);
      }
      if (product.stockQty < newItem.quantity) {
        throw new ApiError(`Not enough stock for ${product.name}`, 409);
      }
      const unitPrice = Number(product.sellingPrice);
      const lineTotal = unitPrice * newItem.quantity;
      newTotal += lineTotal;
      newLineItems.push({
        productId: newItem.productId,
        quantity: newItem.quantity,
        unitPrice,
        lineDiscount: 0,
        lineTotal,
      });
    }

    // grandTotal: positive = customer pays more, negative = we owe refund
    const grandTotal = parseFloat((newTotal - returnedTotal).toFixed(2));

    const exchangeSale = await tx.sale.create({
      data: {
        status: "COMPLETED",
        type: "EXCHANGE",
        originalSaleId: input.originalSaleId,
        customerId: originalSale.customerId,
        cashierId: input.cashierId,
        subtotal: newTotal,
        discountTotal: parseFloat(returnedTotal.toFixed(2)), // returned credit
        taxTotal: 0,
        grandTotal,
        paymentMethod: input.paymentMethod,
        amountPaid: grandTotal > 0 ? grandTotal : 0,
        completedAt: new Date(),
        items: {
          createMany: {
            data: newLineItems,
          },
        },
      },
      include: { items: true },
    });

    // Restore stock for returned items
    for (const returned of input.returnedItems) {
      await tx.product.update({
        where: { id: returned.productId },
        data: { stockQty: { increment: returned.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: returned.productId,
          type: "EXCHANGE_RETURN",
          quantity: returned.quantity,
          saleId: exchangeSale.id,
          note: `Returned from exchange against ${originalSale.billNumber}`,
        },
      });
    }

    // Decrement stock for new items
    for (const newItem of input.newItems) {
      await tx.product.update({
        where: { id: newItem.productId },
        data: { stockQty: { decrement: newItem.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: newItem.productId,
          type: "EXCHANGE_OUT",
          quantity: -newItem.quantity,
          saleId: exchangeSale.id,
        },
      });
    }

    return exchangeSale;
  });
}
