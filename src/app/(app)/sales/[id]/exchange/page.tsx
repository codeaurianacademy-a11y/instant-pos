import { notFound } from "next/navigation";
import { getSaleById } from "@/server/services/saleService";
import { requireSession } from "@/lib/session";
import { ApiError } from "@/lib/api-error";
import { ExchangeForm } from "./ExchangeForm";

export default async function ExchangePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  let sale;
  try {
    sale = await getSaleById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (sale.status !== "COMPLETED" || sale.exchangedInto) {
    notFound();
  }

  if (session.role !== "ADMIN" && sale.cashierId !== session.sub) {
    notFound();
  }

  // Calculate the actual effective price per unit that the customer paid,
  // factoring in the global sale-level discount proportionally.
  // e.g. Sale: subtotal=530, discountTotal=100, grandTotal=430
  //      Item lineTotal=530 → effectiveLineTotal = 530 * (430/530) = 430
  const subtotal = Number(sale.subtotal);
  const grandTotal = Number(sale.grandTotal);
  const discountRatio = subtotal > 0 ? grandTotal / subtotal : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <ExchangeForm
        originalSaleId={sale.id}
        originalBillNumber={sale.billNumber}
        returnableItems={sale.items.map((item) => {
          const lineTotal = Number(item.lineTotal); // already accounts for per-line lineDiscount
          // Apply global discount ratio to get what customer actually paid for this line
          const effectiveLineTotal = lineTotal * discountRatio;
          const effectiveUnitPrice = item.quantity > 0 ? effectiveLineTotal / item.quantity : 0;
          return {
            productId: item.productId,
            productName: item.product.name,
            unitPrice: effectiveUnitPrice.toFixed(2), // actual amount paid per unit
            originalUnitPrice: item.unitPrice.toString(), // MRP for reference
            maxQuantity: item.quantity,
          };
        })}
      />
    </div>
  );
}
