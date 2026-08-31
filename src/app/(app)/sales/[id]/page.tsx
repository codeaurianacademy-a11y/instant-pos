import { notFound } from "next/navigation";
import { getSaleById } from "@/server/services/saleService";
import { getSession } from "@/lib/session";
import { ApiError } from "@/lib/api-error";
import { BillView } from "@/components/sales/BillView";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  let sale;
  try {
    sale = await getSaleById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <BillView
        isAdmin={session?.role === "ADMIN"}
        currentUserId={session?.sub}
        sale={{
          id: sale.id,
          billNumber: sale.billNumber,
          type: sale.type,
          status: sale.status,
          subtotal: sale.subtotal.toString(),
          discountTotal: sale.discountTotal.toString(),
          taxTotal: sale.taxTotal.toString(),
          grandTotal: sale.grandTotal.toString(),
          paymentMethod: sale.paymentMethod,
          amountPaid: sale.amountPaid?.toString() ?? null,
          completedAt: sale.completedAt?.toISOString() ?? null,
          createdAt: sale.createdAt.toISOString(),
          isEdited: sale.isEdited,
          editHistory: sale.editHistory,
          customer: sale.customer ? { name: sale.customer.name, phone: sale.customer.phone } : null,
          cashierId: sale.cashierId,
          cashier: sale.cashier,
          items: sale.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            lineDiscount: item.lineDiscount.toString(),
            lineTotal: item.lineTotal.toString(),
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
          })),
          originalSale: sale.originalSale,
          exchangedInto: sale.exchangedInto,
        }}
      />
    </div>
  );
}
