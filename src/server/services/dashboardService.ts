import { prisma } from "@/lib/prisma";

/** Returns local midnight as a UTC Date, accounting for IST (or any timezone offset) */
function localMidnightToUtc(localDate?: Date): Date {
  const d = localDate ?? new Date();
  // Zero out time in local timezone, then get the UTC equivalent
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function localEndOfDayToUtc(localDate?: Date): Date {
  const d = localDate ?? new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export async function getTodaysSalesSummary() {
  const todayStart = localMidnightToUtc();
  const todayEnd = localEndOfDayToUtc();

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: todayStart, lte: todayEnd },
    },
    include: {
      cashier: { select: { name: true } },
      items: {
        include: {
          product: {
            select: {
              costPrice: true,
              sellingPrice: true,
            },
          },
        },
      },
      stockMovements: {
        include: {
          product: {
            select: {
              costPrice: true,
              sellingPrice: true,
            },
          },
        },
      },
    },
  });

  // Net Revenue: Only count SALE type grandTotal (EXCHANGE grand total represents
  // what customer pays for the NEW items in an exchange — still valid revenue)
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);

  // Net Cost of Goods Sold (COGS):
  // Use stockMovements when available (accurate for exchanges too):
  // - Negative qty movement = item left store → cost added
  // - Positive qty movement = item came back → cost recovered
  // Fall back to items if stockMovements not recorded
  let totalCost = 0;
  for (const sale of sales) {
    if (sale.stockMovements && sale.stockMovements.length > 0) {
      for (const mov of sale.stockMovements) {
        const unitCost = Number(mov.product?.costPrice ?? 0);
        totalCost += -mov.quantity * unitCost; // negative qty → positive cost
      }
    } else {
      // Fallback: for SALE type, items all went out; for EXCHANGE, items are net new
      for (const item of sale.items) {
        const unitCost = Number(item.product?.costPrice ?? 0);
        totalCost += item.quantity * unitCost;
      }
    }
  }

  const netProfit = totalAmount - totalCost;
  const profitMargin = totalAmount > 0 ? (netProfit / totalAmount) * 100 : 0;

  // billCount = only COMPLETED SALE type (not exchanges)
  const billCount = sales.filter((s) => s.type === "SALE").length;
  const exchangeCount = sales.filter((s) => s.type === "EXCHANGE").length;

  // Discounts only from regular SALE type
  const totalDiscounts = sales.reduce((sum, sale) => {
    if (sale.type === "SALE") return sum + Number(sale.discountTotal);
    return sum;
  }, 0);

  const byCashierMap = new Map<string, { name: string; total: number; count: number }>();
  for (const sale of sales) {
    const existing = byCashierMap.get(sale.cashierId);
    if (existing) {
      existing.total += Number(sale.grandTotal);
      existing.count += 1;
    } else {
      byCashierMap.set(sale.cashierId, { name: sale.cashier.name, total: Number(sale.grandTotal), count: 1 });
    }
  }

  return {
    totalAmount: Math.max(0, totalAmount),
    totalCost: Math.max(0, totalCost),
    netProfit,
    profitMargin,
    billCount,
    exchangeCount,
    totalDiscounts,
    byCashier: Array.from(byCashierMap.values()),
  };
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, barcode: true, stockQty: true, lowStockAlert: true },
    orderBy: { stockQty: "asc" },
  });

  // Low stock = qty > 0 but qty <= lowStockAlert (exclude out-of-stock)
  return products.filter((product) => product.stockQty > 0 && product.stockQty <= product.lowStockAlert).slice(0, 10);
}

export async function getRecentTransactions() {
  const sales = await prisma.sale.findMany({
    where: { status: { in: ["COMPLETED", "VOIDED"] } },
    orderBy: { completedAt: "desc" },
    take: 10,
    select: {
      id: true,
      billNumber: true,
      type: true,
      status: true,
      grandTotal: true,
      completedAt: true,
      cashier: { select: { name: true } },
      customer: { select: { name: true, phone: true } },
    },
  });

  return sales.map((sale) => ({ ...sale, grandTotal: Number(sale.grandTotal) }));
}
