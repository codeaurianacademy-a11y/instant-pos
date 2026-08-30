import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { saveDraft, listDrafts } from "@/server/services/saleService";

const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  lineDiscount: z.number().nonnegative().optional(),
});

const saveDraftSchema = z.object({
  saleId: z.string().optional(),
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  items: z.array(cartLineSchema).min(1),
  discountTotal: z.number().nonnegative().optional(),
  taxTotal: z.number().nonnegative().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const drafts = await listDrafts(session.role === "ADMIN" ? undefined : session.sub);
    return NextResponse.json({ drafts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = saveDraftSchema.parse(body);

    const draft = await saveDraft({ ...data, cashierId: session.sub });
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
