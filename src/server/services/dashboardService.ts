import { prisma } from "@/lib/prisma";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getTodaysSalesSummary() {
  const todayStart = startOfToday();

  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: todayStart },
    },
    select: {
      grandTotal: true,
      discountTotal: true,
      type: true,
      cashierId: true,
      cashier: { select: { name: true } },
    },
  });

  // Revenue = sum of regular sales grandTotal
  //           + exchange bills grandTotal (positive = extra collected, negative = refund given)
  // This correctly nets out returns: e.g. Sale +430, Exchange -430 = net 0
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);

  const billCount = sales.filter((s) => s.type === "SALE").length;
  const exchangeCount = sales.filter((s) => s.type === "EXCHANGE").length;
  const totalDiscounts = sales.reduce((sum, sale) => {
    // For EXCHANGE bills, discountTotal = returned credit (don't double count)
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
    totalAmount: Math.max(0, totalAmount), // floor at 0 if all returns
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

  return products.filter((product) => product.stockQty <= product.lowStockAlert).slice(0, 10);
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
