import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { getProductByBarcode } from "@/server/services/productService";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireSession();
    const { code } = await params;

    const product = await getProductByBarcode(code);
    return NextResponse.json({ product });
  } catch (error) {
    return handleApiError(error);
  }
}
