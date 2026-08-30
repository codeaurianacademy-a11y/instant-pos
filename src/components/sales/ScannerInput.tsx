"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CameraScannerModal } from "@/components/sales/CameraScannerModal";

interface ScannerInputProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

export function ScannerInput({ onScan, disabled }: ScannerInputProps) {
  const [manualValue, setManualValue] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (disabled) return;

    let buffer = "";
    let lastTime = 0;

    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey || (e.key.length > 1 && e.key !== "Enter")) return;

      // If another input/textarea/select is focused (not our scanner input),
      // don't intercept — let that field handle normal keyboard input.
      const activeEl = document.activeElement;
      const isOtherInputFocused =
        activeEl &&
        activeEl !== inputRef.current &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable);

      if (isOtherInputFocused) {
        // But if it looks like a barcode scanner burst (very fast Enter),
        // we still want to trigger scan even if another input is focused.
        // Only intercept the Enter key when buffer is long enough and came fast.
        if (e.key === "Enter") {
          const currentTime = Date.now();
          if (buffer.length >= 3 && currentTime - lastTime < 80) {
            e.preventDefault();
            e.stopPropagation();
            const code = buffer;
            buffer = "";
            // Clear the other input if it received scanner characters
            if (
              activeEl &&
              activeEl !== inputRef.current &&
              activeEl.tagName === "INPUT"
            ) {
              const inputEl = activeEl as HTMLInputElement;
              // Remove the scanner characters that leaked into the input
              const leaked = inputEl.value.slice(-code.length);
              if (leaked.toUpperCase() === code.toUpperCase()) {
                inputEl.value = inputEl.value.slice(0, -code.length);
                // Trigger React's synthetic onChange so state syncs
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  "value"
                )?.set;
                nativeInputValueSetter?.call(inputEl, inputEl.value);
                inputEl.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }
            onScan(code);
          } else {
            buffer = "";
          }
        } else {
          // Accumulate buffer even when another input is focused
          // so we can detect the Enter at the end
          const currentTime = Date.now();
          buffer = currentTime - lastTime > 150 ? e.key : buffer + e.key;
          lastTime = currentTime;
        }
        return;
      }

      const currentTime = Date.now();

      if (e.key === "Enter") {
        if (buffer.length >= 2 && currentTime - lastTime < 100) {
          e.preventDefault();
          e.stopPropagation();
          const code = buffer;
          buffer = "";
          onScan(code);
        } else {
          buffer = "";
        }
        return;
      }

      buffer = currentTime - lastTime > 100 ? e.key : buffer + e.key;
      lastTime = currentTime;
    }

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [onScan, disabled]);


  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualValue.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setManualValue("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <form onSubmit={handleManualSubmit} className="flex-1">
        <Input
          ref={inputRef}
          placeholder="Scan barcode or type SKU…"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          disabled={disabled}
          autoFocus
          className="h-10 text-sm shadow-2xs"
        />
      </form>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsCameraOpen(true)}
        disabled={disabled}
        className="shrink-0 h-10 px-3 sm:px-4 font-semibold"
      >
        <svg className="h-4 w-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">Camera Scan</span>
        <span className="sm:hidden text-xs">Scan</span>
      </Button>

      <CameraScannerModal
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={(code) => {
          setIsCameraOpen(false);
          onScan(code);
        }}
      />
    </div>
  );
}
