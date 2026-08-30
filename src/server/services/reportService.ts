import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface ReportFilter {
  from?: string;
  to?: string;
}

export async function getFinancialAndInventoryReport(filter: ReportFilter = {}) {
  const { from, to } = filter;

  // 1. Query Sales for Selected Date Range
  const where: Prisma.SaleWhereInput = {
    status: "COMPLETED",
  };

  if (from || to) {
    where.completedAt = {};
    if (from) where.completedAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.completedAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { completedAt: "desc" },
    include: {
      cashier: { select: { id: true, name: true, username: true } },
      customer: { select: { name: true, phone: true } },
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
            },
          },
        },
      },
      stockMovements: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              costPrice: true,
              sellingPrice: true,
            },
          },
        },
      },
    },
  });

  // 2. Accurate Financial Analytics
  // Net Revenue (Cash/UPI/Card actually collected, refunds subtracted)
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.grandTotal), 0);

  // Total Discounts Given on regular sales
  const totalDiscounts = sales.reduce((sum, s) => {
    if (s.type === "SALE") return sum + Number(s.discountTotal);
    return sum;
  }, 0);

  // Total Cost of Goods Sold (COGS)
  // - Negative stock movement = stock out (cost added)
  // - Positive stock movement = stock in / returned (cost recovered)
  let totalCost = 0;
  for (const sale of sales) {
    if (sale.stockMovements && sale.stockMovements.length > 0) {
      for (const mov of sale.stockMovements) {
        const unitCost = Number(mov.product?.costPrice ?? 0);
        totalCost += -mov.quantity * unitCost;
      }
    } else if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        const unitCost = Number(item.product?.costPrice ?? 0);
        totalCost += item.quantity * unitCost;
      }
    }
  }

  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const regularSalesCount = sales.filter((s) => s.type === "SALE").length;
  const exchangeCount = sales.filter((s) => s.type === "EXCHANGE").length;

  // 3. Payment Method Breakdown
  const paymentBreakdown: Record<string, { count: number; total: number }> = {
    CASH: { count: 0, total: 0 },
    UPI: { count: 0, total: 0 },
    CARD: { count: 0, total: 0 },
    OTHER: { count: 0, total: 0 },
  };

  for (const s of sales) {
    const method = s.paymentMethod || "CASH";
    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = { count: 0, total: 0 };
    }
    paymentBreakdown[method].count += 1;
    paymentBreakdown[method].total += Number(s.grandTotal);
  }

  // 4. Product-Level Sales & Profit Performance
  const productPerformanceMap = new Map<
    string,
    {
      id: string;
      name: string;
      barcode: string;
      category: string;
      costPrice: number;
      sellingPrice: number;
      unitsSold: number;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }
  >();

  for (const sale of sales) {
    const subtotal = Number(sale.subtotal);
    const grandTotal = Number(sale.grandTotal);
    const discountRatio = subtotal > 0 ? grandTotal / subtotal : 1;

    for (const item of sale.items) {
      const p = item.product;
      if (!p) continue;

      const qty = item.quantity;
      const unitCost = Number(p.costPrice);
      const effectiveLineRev = Number(item.lineTotal) * discountRatio;
      const lineCost = qty * unitCost;
      const lineProfit = effectiveLineRev - lineCost;

      const existing = productPerformanceMap.get(p.id);
      if (existing) {
        existing.unitsSold += qty;
        existing.revenue += effectiveLineRev;
        existing.cost += lineCost;
        existing.profit += lineProfit;
        existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
      } else {
        productPerformanceMap.set(p.id, {
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          category: p.category,
          costPrice: unitCost,
          sellingPrice: Number(p.sellingPrice),
          unitsSold: qty,
          revenue: effectiveLineRev,
          cost: lineCost,
          profit: lineProfit,
          margin: effectiveLineRev > 0 ? (lineProfit / effectiveLineRev) * 100 : 0,
        });
      }
    }
  }

  const topProducts = Array.from(productPerformanceMap.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 15);

  // 5. Cashier Performance
  const cashierMap = new Map<
    string,
    {
      id: string;
      name: string;
      username: string;
      billsCount: number;
      revenue: number;
    }
  >();

  for (const sale of sales) {
    const cashierId = sale.cashierId;
    const existing = cashierMap.get(cashierId);
    if (existing) {
      existing.billsCount += 1;
      existing.revenue += Number(sale.grandTotal);
    } else {
      cashierMap.set(cashierId, {
        id: cashierId,
        name: sale.cashier.name,
        username: sale.cashier.username,
        billsCount: 1,
        revenue: Number(sale.grandTotal),
      });
    }
  }

  const cashierPerformance = Array.from(cashierMap.values()).sort((a, b) => b.revenue - a.revenue);

  // 6. Current Live Inventory Valuation (Real-Time Snapshot)
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      barcode: true,
      category: true,
      costPrice: true,
      sellingPrice: true,
      stockQty: true,
      lowStockAlert: true,
    },
    orderBy: { name: "asc" },
  });

  let totalStockUnits = 0;
  let totalStockCostValue = 0;
  let totalStockRetailValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of allProducts) {
    const qty = p.stockQty;
    const cost = Number(p.costPrice);
    const price = Number(p.sellingPrice);

    totalStockUnits += qty;
    totalStockCostValue += qty * cost;
    totalStockRetailValue += qty * price;

    if (qty <= 0) outOfStockCount++;
    else if (qty <= p.lowStockAlert) lowStockCount++;
  }

  const potentialInventoryProfit = totalStockRetailValue - totalStockCostValue;
  const potentialInventoryMargin =
    totalStockRetailValue > 0 ? (potentialInventoryProfit / totalStockRetailValue) * 100 : 0;

  return {
    financials: {
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
      totalDiscounts,
      totalBills: sales.length,
      regularSalesCount,
      exchangeCount,
    },
    inventoryValuation: {
      totalProducts: allProducts.length,
      totalStockUnits,
      totalStockCostValue,
      totalStockRetailValue,
      potentialInventoryProfit,
      potentialInventoryMargin,
      lowStockCount,
      outOfStockCount,
    },
    paymentBreakdown,
    topProducts,
    cashierPerformance,
  };
}
