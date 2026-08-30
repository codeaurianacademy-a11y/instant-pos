import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { listProducts, createProduct } from "@/server/services/productService";
import { jsonObjectSchema } from "@/lib/json-schema";

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  barcode: z.string().trim().optional(),
  category: z.string().trim().min(1),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  stockQty: z.number().int().nonnegative(),
  lowStockAlert: z.number().int().nonnegative().optional(),
  attributes: jsonObjectSchema.optional(),
});

export async function GET(request: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const category = searchParams.get("category") ?? undefined;

    const products = await listProducts({ search, category });
    return NextResponse.json({ products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = createProductSchema.parse(body);

    const product = await createProduct({ ...data, adminId: session.sub });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
