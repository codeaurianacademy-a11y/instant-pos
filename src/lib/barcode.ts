import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const SKU_PREFIX = "SK-";
const SKU_DIGITS = 6;
const MAX_ALLOCATION_ATTEMPTS = 100_000;

type DbClient = typeof prisma | Prisma.TransactionClient;

// Sequential SK-000001, SK-000002, ... scheme, encoded as CODE128 for printed
// labels. Single-store, so the sequence isn't scoped per user/tenant.
//
// Accepts an optional transaction client so callers already inside a
// prisma.$transaction (e.g. CSV import, which loops this per row) reuse that
// transaction's connection instead of opening a second one per call.
export async function generateBarcode(db: DbClient = prisma): Promise<string> {
  const lastProduct = await db.product.findFirst({
    where: { barcode: { startsWith: SKU_PREFIX } },
    orderBy: { barcode: "desc" },
    select: { barcode: true },
  });

  let max = 0;
  if (lastProduct?.barcode) {
    const match = lastProduct.barcode.match(/^SK-(\d+)$/);
    if (match) max = parseInt(match[1], 10);
  }

  for (let seq = max + 1; seq < max + MAX_ALLOCATION_ATTEMPTS; seq++) {
    const candidate = `${SKU_PREFIX}${String(seq).padStart(SKU_DIGITS, "0")}`;
    const taken = await db.product.findFirst({ where: { barcode: candidate } });
    if (!taken) return candidate;
  }

  throw new Error("Could not allocate a unique barcode");
}
