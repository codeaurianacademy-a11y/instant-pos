import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Prisma.SaleWhereInput = {};

    // Status filter
    if (status && status !== "ALL") {
      where.status = status as Prisma.EnumSaleStatusFilter["equals"];
    } else {
      where.status = { in: ["COMPLETED", "VOIDED"] };
    }

    // Type filter
    if (type && type !== "ALL") {
      where.type = type as Prisma.EnumSaleTypeFilter["equals"];
    }

    // Date range filter
    if (from || to) {
      where.completedAt = {};
      if (from) {
        where.completedAt.gte = new Date(`${from}T00:00:00.000Z`);
      }
      if (to) {
        where.completedAt.lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    // Search query filter (Customer Name, Customer Phone, Bill Number, Item name)
    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        {
          items: {
            some: {
              product: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { completedAt: "desc" },
      include: {
        customer: true,
        cashier: { select: { name: true, username: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
        originalSale: { select: { id: true, billNumber: true } },
        exchangedInto: { select: { id: true, billNumber: true } },
      },
    });

    // Revenue = sum of all COMPLETED bills' grandTotal
    // Exchange bills have negative grandTotal when customer got refund → correctly reduces revenue
    const totalAmount = sales
      .filter((s) => s.status === "COMPLETED")
      .reduce((sum, s) => sum + Number(s.grandTotal), 0);

    // Only count discounts from regular SALE bills (EXCHANGE discountTotal = returned credit, not a discount)
    const totalDiscounts = sales
      .filter((s) => s.status === "COMPLETED" && s.type === "SALE")
      .reduce((sum, s) => sum + Number(s.discountTotal), 0);

    const regularSalesCount = sales.filter((s) => s.type === "SALE").length;
    const pureReturnsCount = sales.filter((s) => s.type === "EXCHANGE" && s.items.length === 0).length;
    const exchangeWithNewItemsCount = sales.filter((s) => s.type === "EXCHANGE" && s.items.length > 0).length;
    const totalExchanges = sales.filter((s) => s.type === "EXCHANGE").length;

    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      billNumber: sale.billNumber,
      type: sale.type,
      status: sale.status,
      subtotal: Number(sale.subtotal),
      discountTotal: Number(sale.discountTotal),
      taxTotal: Number(sale.taxTotal),
      grandTotal: Number(sale.grandTotal),
      paymentMethod: sale.paymentMethod,
      amountPaid: sale.amountPaid ? Number(sale.amountPaid) : null,
      completedAt: sale.completedAt?.toISOString() ?? sale.createdAt.toISOString(),
      customer: sale.customer
        ? {
            name: sale.customer.name,
            phone: sale.customer.phone.startsWith("phone_") ? null : sale.customer.phone,
          }
        : null,
      cashier: sale.cashier,
      items: sale.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        product: item.product,
      })),
      originalSale: sale.originalSale,
      exchangedInto: sale.exchangedInto,
    }));

    return NextResponse.json({
      sales: formattedSales,
      metrics: {
        totalAmount,
        totalDiscounts,
        totalBills: sales.length,
        regularSalesCount,
        pureReturnsCount,
        exchangeWithNewItemsCount,
        totalExchanges,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
