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
      cashierId: true,
      cashier: { select: { name: true } },
    },
  });

  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
  const billCount = sales.length;

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
    totalAmount,
    billCount,
    byCashier: Array.from(byCashierMap.values()),
  };
}

// Compared in application code rather than a DB-level column-to-column filter —
// keeps this independent of Prisma's fieldReference feature flag/stability status.
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
      customer: { select: { name: true } },
    },
  });

  return sales.map((sale) => ({ ...sale, grandTotal: Number(sale.grandTotal) }));
}
