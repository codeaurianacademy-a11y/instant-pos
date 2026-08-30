import { NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { getSaleById, voidSale } from "@/server/services/saleService";

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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const sale = await voidSale(id);
    return NextResponse.json({ sale });
  } catch (error) {
    return handleApiError(error);
  }
}
