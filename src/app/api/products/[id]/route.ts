import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { updateProduct, adjustStock } from "@/server/services/productService";
import { jsonObjectSchema } from "@/lib/json-schema";

const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  costPrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  lowStockAlert: z.number().int().nonnegative().optional(),
  attributes: jsonObjectSchema.optional(),
  isActive: z.boolean().optional(),
  stockAdjustment: z
    .object({
      quantityDelta: z.number().int(),
      note: z.string().trim().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = updateProductSchema.parse(body);

    if (data.stockAdjustment) {
      await adjustStock({
        productId: id,
        quantityDelta: data.stockAdjustment.quantityDelta,
        note: data.stockAdjustment.note,
        adminId: session.sub,
      });
    }

    const { stockAdjustment: _unused, ...productFields } = data;
    const hasProductFields = Object.keys(productFields).length > 0;

    const product = hasProductFields
      ? await updateProduct({ id, ...productFields, adminId: session.sub })
      : null;

    return NextResponse.json({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const product = await updateProduct({ id, isActive: false, adminId: session.sub });
    return NextResponse.json({ product });
  } catch (error) {
    return handleApiError(error);
  }
}
