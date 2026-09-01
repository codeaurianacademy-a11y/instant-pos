import Papa from "papaparse";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { handleApiError, ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const querySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const { from, to } = querySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const completedAtFilter: Prisma.DateTimeFilter = {};
    if (from) {
      const [y, m, d] = from.split("-").map(Number);
      completedAtFilter.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    if (to) {
      const [y, m, d] = to.split("-").map(Number);
      completedAtFilter.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
    }

    if (from && to && new Date(from) > new Date(to)) {
      throw new ApiError("'from' date must be before 'to' date", 400);
    }

    const sales = await prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        ...(from || to ? { completedAt: completedAtFilter } : {}),
      },
      orderBy: { completedAt: "asc" },
      include: {
        customer: { select: { name: true, phone: true } },
        cashier: { select: { name: true } },
        items: { include: { product: { select: { name: true, barcode: true } } } },
      },
    });

    const rows = sales.flatMap((sale) =>
      sale.items.map((item) => ({
        billNumber: sale.billNumber,
        date: sale.completedAt?.toISOString().slice(0, 10) ?? "",
        type: sale.type,
        product: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        lineDiscount: item.lineDiscount.toString(),
        lineTotal: item.lineTotal.toString(),
        customerName: sale.customer?.name ?? "",
        customerPhone: sale.customer?.phone ?? "",
        cashier: sale.cashier.name,
        paymentMethod: sale.paymentMethod ?? "",
        billGrandTotal: sale.grandTotal.toString(),
      }))
    );

    const csv = Papa.unparse(rows, {
      columns: [
        "billNumber",
        "date",
        "type",
        "product",
        "barcode",
        "quantity",
        "unitPrice",
        "lineDiscount",
        "lineTotal",
        "customerName",
        "customerPhone",
        "cashier",
        "paymentMethod",
        "billGrandTotal",
      ],
    });

    const filename = `sales-export-${from ?? "all"}-to-${to ?? "now"}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
