"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BarcodeLabel } from "@/components/inventory/BarcodeLabel";

interface BarcodeLabelModalProps {
  open: boolean;
  onClose: () => void;
  product: { barcode: string; name: string } | null;
}

export function BarcodeLabelModal({ open, onClose, product }: BarcodeLabelModalProps) {
  if (!product) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <Modal open={open} onClose={onClose} title="Product label">
      <div className="flex flex-col items-center gap-4">
        <div id="barcode-print-area" className="rounded-lg border border-border p-4">
          <BarcodeLabel value={product.barcode} productName={product.name} />
        </div>
        <div className="flex justify-end gap-2 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #barcode-print-area,
          #barcode-print-area * {
            visibility: visible;
          }
          #barcode-print-area {
            position: fixed;
            top: 0;
            left: 0;
          }
        }
      `}</style>
    </Modal>
  );
}
