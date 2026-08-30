"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface ImportRowResult {
  row: number;
  name: string;
  status: "created" | "updated" | "error";
  barcode?: string;
  message?: string;
}

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportCsvModal({ open, onClose, onImported }: ImportCsvModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ImportRowResult[] | null>(null);
  const [summary, setSummary] = useState<{ created: number; updated: number; errors: number } | null>(
    null
  );

  function handleClose() {
    setResults(null);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  async function handleFileChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResults(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Import failed", "danger");
        return;
      }

      setResults(data.results);
      setSummary(data.summary);
      if (data.summary.created + data.summary.updated > 0) {
        onImported();
      }
    } catch {
      showToast("Something went wrong during import.", "danger");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import products from CSV">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          CSV must include columns: <code className="font-mono">name, category, cost, price, stock</code>.
          An optional <code className="font-mono">barcode</code> column can be left blank to
          auto-generate one. If a barcode matches an existing product, its stock is added to and its
          details are updated.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:bg-accent-hover file:cursor-pointer disabled:opacity-50"
        />

        {isUploading && <p className="text-sm text-muted">Importing…</p>}

        {summary && (
          <div className="flex gap-2">
            <Badge tone="success">{summary.created} created</Badge>
            <Badge tone="accent">{summary.updated} updated</Badge>
            {summary.errors > 0 && <Badge tone="danger">{summary.errors} errors</Badge>}
          </div>
        )}

        {results && results.some((r) => r.status === "error") && (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted">Row</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results
                  .filter((r) => r.status === "error")
                  .map((r) => (
                    <tr key={r.row}>
                      <td className="px-3 py-2 text-muted">{r.row}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 text-danger">{r.message}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
