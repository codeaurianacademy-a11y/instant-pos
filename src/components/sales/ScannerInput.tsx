"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CameraScannerModal } from "@/components/sales/CameraScannerModal";

interface ScannerInputProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

// Global keyboard-wedge listener: a USB/Bluetooth barcode scanner types
// characters far faster than a human and ends with Enter. If characters
// arrive under 100ms apart and the buffer ends in Enter with length >= 3,
// treat it as a scanner burst rather than someone typing in another field.
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

      const currentTime = Date.now();

      if (e.key === "Enter") {
        if (buffer.length >= 3 && currentTime - lastTime < 100) {
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
    <div className="flex gap-2">
      <form onSubmit={handleManualSubmit} className="flex-1">
        <Input
          ref={inputRef}
          placeholder="Scan or type a barcode…"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          disabled={disabled}
          autoFocus
        />
      </form>
      <Button type="button" variant="secondary" onClick={() => setIsCameraOpen(true)} disabled={disabled}>
        Camera scan
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
