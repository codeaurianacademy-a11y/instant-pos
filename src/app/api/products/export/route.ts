import Papa from "papaparse";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireSession();

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const rows = products.map((product) => ({
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      cost: product.costPrice.toString(),
      price: product.sellingPrice.toString(),
      stock: product.stockQty,
    }));

    const csv = Papa.unparse(rows, { columns: ["name", "barcode", "category", "cost", "price", "stock"] });
    const filename = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;

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
