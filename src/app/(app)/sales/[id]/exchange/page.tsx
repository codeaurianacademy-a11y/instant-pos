import { notFound } from "next/navigation";
import { getSaleById } from "@/server/services/saleService";
import { ApiError } from "@/lib/api-error";
import { ExchangeForm } from "./ExchangeForm";

export default async function ExchangePage({ params }: { params: Promise<{ id: string }> }) {
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

  if (sale.status !== "COMPLETED" || sale.type !== "SALE" || sale.exchangedInto) {
    notFound();
  }

  return (
    <div className="p-6 max-w-3xl">
      <ExchangeForm
        originalSaleId={sale.id}
        originalBillNumber={sale.billNumber}
        returnableItems={sale.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          unitPrice: item.unitPrice.toString(),
          maxQuantity: item.quantity,
        }))}
      />
    </div>
  );
}
