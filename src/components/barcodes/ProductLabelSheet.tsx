"use client";

import type { ProductDTO } from "@/lib/types";
import { ProductLabel, type LabelSize, LABEL_SIZES_CONFIG } from "./ProductLabel";

export type LabelEntry = {
  product: ProductDTO;
  qty: number;
};

interface SheetGridCfg {
  cols: number;
  rows: number;
  hGapMm: number;
  vGapMm: number;
  offsetTopMm: number;
  offsetLeftMm: number;
}

export const SHEET_GRIDS: Record<LabelSize, SheetGridCfg> = {
  "38x21":  { cols: 5, rows: 13, hGapMm: 0, vGapMm: 0, offsetTopMm: 4.5, offsetLeftMm: 9 },
  "45x21":  { cols: 4, rows: 12, hGapMm: 0, vGapMm: 0, offsetTopMm: 4.5, offsetLeftMm: 9 },
  // NovaJet 48x24 standard sticker sheets (4x12 = 48 labels per sheet)
  "48x24":  { cols: 4, rows: 12, hGapMm: 3, vGapMm: 0, offsetTopMm: 4, offsetLeftMm: 4 },
  "64x34":  { cols: 3, rows: 8,  hGapMm: 0, vGapMm: 0, offsetTopMm: 4.5, offsetLeftMm: 9 },
  "100x44": { cols: 2, rows: 6,  hGapMm: 0, vGapMm: 0, offsetTopMm: 4.5, offsetLeftMm: 9 },
};

export function ProductLabelSheet({
  entries,
  size = "48x24",
}: {
  entries: LabelEntry[];
  size?: LabelSize;
}) {
  const grid = SHEET_GRIDS[size];
  const cfg = LABEL_SIZES_CONFIG[size];
  const labelsPerSheet = grid.cols * grid.rows;

  const allLabels = entries.flatMap((entry) =>
    Array.from({ length: entry.qty }, (_, i) => (
      <ProductLabel
        key={`${entry.product.id}-${i}`}
        product={entry.product}
        size={size}
        printMode={true}
      />
    ))
  );

  const pages = [];
  for (let i = 0; i < allLabels.length; i += labelsPerSheet) {
    pages.push(allLabels.slice(i, i + labelsPerSheet));
  }

  return (
    <div id="product-label-print-root">
      {pages.map((page, index) => (
        <div
          key={index}
          style={{
            pageBreakAfter: index < pages.length - 1 ? "always" : "auto",
            breakAfter: index < pages.length - 1 ? "page" : "auto",
          }}
        >
          <div
            style={{
              display: "flow-root",
              paddingTop: `${grid.offsetTopMm}mm`,
              paddingLeft: `${grid.offsetLeftMm}mm`,
            }}
          >
            <div
              className="product-label-sheet-grid"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${grid.cols}, ${cfg.widthMm}mm)`,
                gridTemplateRows: `repeat(${grid.rows}, ${cfg.heightMm}mm)`,
                columnGap: `${grid.hGapMm}mm`,
                rowGap: `${grid.vGapMm}mm`,
                width: "fit-content",
              }}
            >
              {page}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
