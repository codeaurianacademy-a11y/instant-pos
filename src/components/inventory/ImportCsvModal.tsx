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

  function downloadSampleCsv() {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "name,category,cost,price,stock,barcode\n" +
      "Cotton T-Shirt Black M,Clothing,250,499,30,890123456701\n" +
      "Denim Jeans 32,Clothing,600,1199,15,\n" +
      "Organic Green Tea 100g,Beverages,90,160,50,890123456702\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_products_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <Modal open={open} onClose={handleClose} title="Import Products from CSV">
      <div className="flex flex-col gap-4">
        {/* CSV Format Guide */}
        <div className="rounded-lg bg-slate-50 border border-border p-3.5 text-xs text-slate-700">
          <div className="flex items-center justify-between font-semibold text-foreground mb-2">
            <span>Required CSV Columns:</span>
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="text-accent hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Sample CSV
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-1.5 text-slate-600 mb-2">
            <li><span className="font-semibold text-foreground">name:</span> Product title (Required)</li>
            <li><span className="font-semibold text-foreground">category:</span> Department / Type (Required)</li>
            <li><span className="font-semibold text-foreground">cost:</span> Purchase cost (Required, &ge; 0)</li>
            <li><span className="font-semibold text-foreground">price:</span> Selling price (Required, &ge; 0)</li>
            <li><span className="font-semibold text-foreground">stock:</span> Initial stock count (Required, &ge; 0)</li>
            <li><span className="font-semibold text-slate-500">barcode:</span> Optional (Auto-generates if blank)</li>
          </ul>
          <p className="text-[11px] text-muted border-t border-border/80 pt-2">
            * Note: If a barcode already exists in database, its details are updated and the imported stock is added to existing stock.
          </p>
        </div>

        {/* Upload Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Select CSV File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-hover file:cursor-pointer disabled:opacity-50 border border-dashed border-slate-300 rounded-lg p-2 bg-white"
          />
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-accent font-medium py-1">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent"></span>
            Importing and syncing with Supabase…
          </div>
        )}

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

        <div className="flex justify-end pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
