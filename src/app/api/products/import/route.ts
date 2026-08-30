import { NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/session";
import { handleApiError, ApiError } from "@/lib/api-error";
import { importProductsFromRows } from "@/server/services/importService";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const REQUIRED_HEADERS = ["name", "category", "cost", "price", "stock"];

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("No file uploaded", 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ApiError("File is too large (max 5MB)", 400);
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      throw new ApiError(`CSV parse error: ${parsed.errors[0].message}`, 400);
    }

    const headers = parsed.meta.fields ?? [];
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new ApiError(`CSV is missing required column(s): ${missingHeaders.join(", ")}`, 400);
    }

    if (parsed.data.length === 0) {
      throw new ApiError("CSV has no data rows", 400);
    }

    const results = await importProductsFromRows(parsed.data, session.sub);

    const summary = {
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      errors: results.filter((r) => r.status === "error").length,
    };

    return NextResponse.json({ summary, results });
  } catch (error) {
    return handleApiError(error);
  }
}
