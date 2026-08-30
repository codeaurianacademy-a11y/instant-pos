import { notFound } from "next/navigation";
import { getSaleById } from "@/server/services/saleService";
import { requireSession } from "@/lib/session";
import { ApiError } from "@/lib/api-error";
import { EditSaleForm } from "./EditSaleForm";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
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

  if (sale.status !== "COMPLETED") {
    notFound();
  }

  const initialItems = sale.items.map((item) => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      barcode: item.product.barcode,
      category: item.product.category,
      costPrice: item.product.costPrice.toString(),
      sellingPrice: item.product.sellingPrice.toString(),
      stockQty: item.product.stockQty,
      lowStockAlert: 5,
      attributes: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    quantity: item.quantity,
    lineDiscount: Number(item.lineDiscount),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <EditSaleForm
        saleId={sale.id}
        billNumber={sale.billNumber}
        initialCustomerName={sale.customer?.name ?? ""}
        initialCustomerPhone={sale.customer?.phone?.startsWith("phone_") ? "" : sale.customer?.phone ?? ""}
        initialDiscountTotal={Number(sale.discountTotal)}
        initialTaxTotal={Number(sale.taxTotal)}
        initialPaymentMethod={sale.paymentMethod ?? "CASH"}
        initialItems={initialItems}
        originalGrandTotal={Number(sale.grandTotal)}
      />
    </div>
  );
}
