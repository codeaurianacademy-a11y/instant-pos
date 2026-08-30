import { prisma } from "@/lib/prisma";
import { generateBarcode } from "@/lib/barcode";
import { z } from "zod";

const csvRowSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  barcode: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required"),
  cost: z.coerce.number().nonnegative("Cost must be zero or positive"),
  price: z.coerce.number().nonnegative("Price must be zero or positive"),
  stock: z.coerce.number().int("Stock must be a whole number").nonnegative("Stock must be zero or positive"),
});

export interface ImportRowResult {
  row: number;
  name: string;
  status: "created" | "updated" | "error";
  barcode?: string;
  message?: string;
}

export async function importProductsFromRows(
  rawRows: Record<string, string>[],
  adminId: string
): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2; // +1 for 0-index, +1 for header row
    const raw = rawRows[i];
    const parsed = csvRowSchema.safeParse(raw);

    if (!parsed.success) {
      results.push({
        row: rowNumber,
        name: raw.name ?? "(unknown)",
        status: "error",
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      continue;
    }

    const data = parsed.data;

    try {
      const result = await importSingleRow(data, adminId);
      results.push({ row: rowNumber, name: data.name, ...result });
    } catch (error) {
      results.push({
        row: rowNumber,
        name: data.name,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

async function importSingleRow(
  data: z.infer<typeof csvRowSchema>,
  adminId: string
): Promise<{ status: "created" | "updated"; barcode: string }> {
  return prisma.$transaction(async (tx) => {
    const existingByBarcode = data.barcode
      ? await tx.product.findUnique({ where: { barcode: data.barcode } })
      : null;

    if (existingByBarcode) {
      const stockDelta = data.stock;

      await tx.product.update({
        where: { id: existingByBarcode.id },
        data: {
          name: data.name,
          category: data.category,
          costPrice: data.cost,
          sellingPrice: data.price,
          stockQty: { increment: stockDelta },
          updatedByAdminId: adminId,
        },
      });

      if (stockDelta !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: existingByBarcode.id,
            type: "IMPORT",
            quantity: stockDelta,
            note: "CSV import — added to existing stock",
            performedByAdminId: adminId,
          },
        });
      }

      return { status: "updated", barcode: existingByBarcode.barcode };
    }

    const barcode = data.barcode || (await generateBarcode(tx));

    const product = await tx.product.create({
      data: {
        name: data.name,
        barcode,
        category: data.category,
        costPrice: data.cost,
        sellingPrice: data.price,
        stockQty: data.stock,
        updatedByAdminId: adminId,
      },
    });

    if (data.stock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "IMPORT",
          quantity: data.stock,
          note: "CSV import — new product",
          performedByAdminId: adminId,
        },
      });
    }

    return { status: "created", barcode: product.barcode };
  });
}
