import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { getSaleById, voidSale, editSale, deleteSale } from "@/server/services/saleService";

const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  lineDiscount: z.number().nonnegative().optional(),
});

const editSaleSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  items: z.array(cartLineSchema).min(1),
  discountTotal: z.number().nonnegative().optional(),
  taxTotal: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "OTHER"]).optional(),
  amountPaid: z.number().nonnegative().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;

    const sale = await getSaleById(id);
    return NextResponse.json({ sale });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const data = editSaleSchema.parse(body);

    const sale = await editSale({
      saleId: id,
      ...data,
      adminId: session.sub,
      adminName: session.name,
      userRole: session.role,
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("PUT /api/sales/[id] ERROR:", error);
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await deleteSale(id);
    return NextResponse.json({ deleted: true, id: result.id });
  } catch (error) {
    return handleApiError(error);
  }
}
