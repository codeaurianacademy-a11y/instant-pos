"use client";

import { useEffect, useRef, useState } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  itemLabel,
  confirmLabel = "Yes, Delete",
  onConfirm,
  onCancel,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [confirmText, setConfirmText] = useState("");
  const requiresTyping = false; // set true if you want typed confirmation
  const canConfirm = !requiresTyping || confirmText.toLowerCase() === "delete";

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfirmText("");
      setTimeout(() => cancelRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cdm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
        onClick={() => !isDeleting && onCancel()}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[420px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/8 overflow-hidden"
        style={{ animation: "cdm-in 0.18s cubic-bezier(.22,1,.36,1) both" }}
      >
        <style>{`
          @keyframes cdm-in {
            from { opacity: 0; transform: scale(.94) translateY(8px); }
            to   { opacity: 1; transform: scale(1)  translateY(0); }
          }
        `}</style>

        {/* ── Red accent header ── */}
        <div className="relative bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-6 pb-8">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{backgroundImage:"radial-gradient(circle at 20% 50%,#fff 1px,transparent 1px),radial-gradient(circle at 80% 20%,#fff 1px,transparent 1px)",backgroundSize:"24px 24px"}} />

          {/* Icon */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm mb-4">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h2 id="cdm-title" className="relative text-[17px] font-bold text-white leading-snug">
            {title}
          </h2>
          <p className="relative text-sm text-red-100 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-5 pb-6 flex flex-col gap-4">

          {/* Item chip */}
          {itemLabel && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 mt-0.5">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-red-800 break-all leading-snug mt-1">
                {itemLabel}
              </p>
            </div>
          )}

          {/* Warning banner */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3">
            <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.05 3.378c.866-1.5 3.032-1.5 3.898 0l5.355 9.127ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              This action is <strong>permanent and irreversible.</strong> Once deleted, this record cannot be recovered.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting || !canConfirm}
              className="flex-1 h-11 rounded-xl bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-200 transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Deleting…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  {confirmLabel}
                </>
              )}
            </button>
          </div>

          {/* Escape hint */}
          <p className="text-center text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-500">Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </div>
  );
}
