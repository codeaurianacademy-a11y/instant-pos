"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeLabelProps {
  value: string;
  productName?: string;
  widthMm?: number;
  heightPx?: number;
}

const MM_TO_PX = 96 / 25.4;

export function BarcodeLabel({ value, productName, widthMm = 45, heightPx = 40 }: BarcodeLabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const RENDER_SCALE = 3;
    const maxWidthPx = widthMm * MM_TO_PX;

    let moduleWidth = 1.6;
    const MIN_MODULE_WIDTH = 0.8;
    const STEP = 0.1;

    const render = (width: number) => {
      if (!canvasRef.current) return;
      JsBarcode(canvasRef.current, value, {
        format: "CODE128",
        displayValue: true,
        fontSize: 12 * RENDER_SCALE,
        margin: 4,
        height: heightPx * RENDER_SCALE,
        width: width * RENDER_SCALE,
        background: "#ffffff",
        lineColor: "#000000",
      });
    };

    render(moduleWidth);
    while (
      canvasRef.current &&
      canvasRef.current.width / RENDER_SCALE > maxWidthPx &&
      moduleWidth > MIN_MODULE_WIDTH
    ) {
      moduleWidth = Math.max(MIN_MODULE_WIDTH, moduleWidth - STEP);
      render(moduleWidth);
    }
  }, [value, widthMm, heightPx]);

  return (
    <div className="flex flex-col items-center gap-1">
      {productName && <p className="text-xs font-medium text-foreground text-center">{productName}</p>}
      <canvas ref={canvasRef} style={{ maxWidth: `${widthMm}mm` }} />
    </div>
  );
}
