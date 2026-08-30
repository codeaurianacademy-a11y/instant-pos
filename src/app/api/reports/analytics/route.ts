import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";
import { getFinancialAndInventoryReport } from "@/server/services/reportService";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const report = await getFinancialAndInventoryReport({ from, to });
    return NextResponse.json({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
