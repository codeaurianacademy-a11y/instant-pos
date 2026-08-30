import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { completeSale } from "@/server/services/saleService";

const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  lineDiscount: z.number().nonnegative().optional(),
});

const completeSaleSchema = z.object({
  saleId: z.string().optional(),
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  items: z.array(cartLineSchema).min(1),
  discountTotal: z.number().nonnegative().optional(),
  taxTotal: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "OTHER"]),
  amountPaid: z.number().nonnegative(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = completeSaleSchema.parse(body);

    const sale = await completeSale({ ...data, cashierId: session.sub });
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
