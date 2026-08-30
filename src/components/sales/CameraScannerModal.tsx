"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function CameraScannerModal({ open, onClose, onDetected }: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    setError(null);

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        if (cancelled) return;
        controlsRef.current = controls;
        if (result) {
          onDetected(result.getText());
        }
        // NotFoundException fires continuously while no code is in frame — not a real error.
        if (err && err.getKind() !== "NotFoundException") {
          setError("Scanner error. Try again or use manual entry.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not access the camera. Check permissions and try again.");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected]);

  return (
    <Modal open={open} onClose={onClose} title="Scan with camera">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="border-white/40 border-t-white" />
            </div>
          )}
        </div>
        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : (
          <p className="text-sm text-muted">Point the camera at a barcode.</p>
        )}
      </div>
    </Modal>
  );
}
