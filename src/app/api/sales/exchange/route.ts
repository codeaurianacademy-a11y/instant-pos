import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { createExchange } from "@/server/services/exchangeService";

const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const exchangeSchema = z.object({
  originalSaleId: z.string().min(1),
  returnedItems: z.array(cartLineSchema),
  newItems: z.array(cartLineSchema),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "OTHER"]),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = exchangeSchema.parse(body);

    const exchange = await createExchange({ ...data, cashierId: session.sub });
    return NextResponse.json({ exchange }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
