"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { formatCurrency } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

export type LabelSize = "38x21" | "45x21" | "48x24" | "64x34" | "100x44";

interface LabelCfg {
  widthMm: number;
  heightMm: number;
  barcodeBarH: number;
  shopFs: number;
  nameFs: number;
  priceFs: number;
  nameTrunc: number;
}

export const LABEL_SIZES_CONFIG: Record<LabelSize, LabelCfg> = {
  "38x21":  { widthMm: 38,   heightMm: 21,   barcodeBarH: 20, shopFs: 5.5, nameFs: 5.5, priceFs: 5,   nameTrunc: 22 },
  "45x21":  { widthMm: 44.5, heightMm: 20.8, barcodeBarH: 22, shopFs: 5.8, nameFs: 5.8, priceFs: 5.2, nameTrunc: 26 },
  "48x24":  { widthMm: 48,   heightMm: 24,   barcodeBarH: 28, shopFs: 7,   nameFs: 7,   priceFs: 6.5, nameTrunc: 30 },
  "64x34":  { widthMm: 64,   heightMm: 34,   barcodeBarH: 36, shopFs: 9,   nameFs: 8.5, priceFs: 8,   nameTrunc: 42 },
  "100x44": { widthMm: 100,  heightMm: 44,   barcodeBarH: 48, shopFs: 12,  nameFs: 11,  priceFs: 10,  nameTrunc: 62 },
};

const STORE_NAME = "SK COLLECTION";
const MM_TO_PX = 96 / 25.4;

function BarcodeCanvas({
  value,
  barHeight,
  maxWidthMm,
}: {
  value: string;
  barHeight: number;
  maxWidthMm: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    const canvas = canvasRef.current;
    const RENDER_SCALE = 3;
    const maxWidthPx = maxWidthMm * MM_TO_PX;

    let moduleWidth = 1.6;
    const MIN_MODULE_WIDTH = 0.8;
    const STEP = 0.1;

    const render = (width: number) => {
      JsBarcode(canvas, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: barHeight * RENDER_SCALE,
        width: width * RENDER_SCALE,
        background: "#ffffff",
        lineColor: "#000000",
      });
    };

    try {
      render(moduleWidth);
      while (canvas.width / RENDER_SCALE > maxWidthPx && moduleWidth > MIN_MODULE_WIDTH) {
        moduleWidth = Math.max(MIN_MODULE_WIDTH, moduleWidth - STEP);
        render(moduleWidth);
      }
      canvas.style.width = `${canvas.width / RENDER_SCALE}px`;
      canvas.style.height = `${canvas.height / RENDER_SCALE}px`;
    } catch {
      // Fallback for invalid characters in barcode
    }
  }, [value, barHeight, maxWidthMm]);

  return (
    <canvas
      ref={canvasRef}
      style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
    />
  );
}

export function ProductLabel({
  product,
  size = "48x24",
  printMode = false,
}: {
  product: ProductDTO | { name: string; barcode: string; sellingPrice: string | number };
  size?: LabelSize;
  printMode?: boolean;
}) {
  const cfg = LABEL_SIZES_CONFIG[size];
  const barcodeValue = product.barcode?.trim() || "";

  const rawName = product.name?.trim() || "Product";
  const name =
    rawName.length > cfg.nameTrunc
      ? `${rawName.slice(0, cfg.nameTrunc - 1)}…`
      : rawName;

  const price = typeof product.sellingPrice === "number" ? product.sellingPrice : parseFloat(product.sellingPrice) || 0;

  return (
    <div
      style={{
        width: `${cfg.widthMm}mm`,
        height: `${cfg.heightMm}mm`,
        minWidth: `${cfg.widthMm}mm`,
        minHeight: `${cfg.heightMm}mm`,
        maxWidth: `${cfg.widthMm}mm`,
        maxHeight: `${cfg.heightMm}mm`,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5mm",
        background: "#ffffff",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "1mm",
        fontFamily: "Arial, Helvetica, sans-serif",
        outline: printMode ? "none" : "1px dashed #cbd5e1",
        margin: "0",
      }}
    >
      {/* Store Header */}
      <div
        style={{
          fontSize: `${cfg.shopFs}pt`,
          fontWeight: 800,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          width: "100%",
          textAlign: "center",
          lineHeight: 1,
          color: "#000000",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {STORE_NAME}
      </div>

      {/* Barcode Canvas */}
      <div
        style={{
          width: "100%",
          lineHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BarcodeCanvas
          value={barcodeValue}
          barHeight={cfg.barcodeBarH}
          maxWidthMm={cfg.widthMm - 2}
        />
      </div>

      {/* Product Title */}
      <div
        style={{
          fontSize: `${cfg.nameFs}pt`,
          fontWeight: 600,
          width: "100%",
          textAlign: "center",
          lineHeight: 1.1,
          color: "#000000",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: `${cfg.priceFs}pt`,
          fontWeight: 700,
          color: "#000000",
          lineHeight: 1.1,
          width: "100%",
          textAlign: "center",
        }}
      >
        MRP: {formatCurrency(price)}
      </div>
    </div>
  );
}
