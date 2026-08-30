"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function downloadInventoryExport() {
    window.location.href = "/api/products/export";
  }

  function downloadSalesExport() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/sales/export?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="border-b border-border/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Data Exports</h1>
        <p className="text-sm text-muted mt-0.5">Export inventory catalog, historical sales transactions, and audit data as CSV.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Inventory Report */}
        <Card className="shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <CardTitle>Inventory Catalogue Export</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between gap-4 p-6">
            <p className="text-sm text-muted leading-relaxed">
              Export all active products with barcodes, cost prices, retail selling prices, categories, and real-time stock levels. The exported file matches the exact CSV format for batch re-importing.
            </p>
            <div className="pt-2 border-t border-border/80 flex justify-end">
              <Button onClick={downloadInventoryExport} size="md" className="font-semibold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Inventory CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales Report */}
        <Card className="shadow-xs">
          <CardHeader className="py-4 px-6 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <CardTitle>Sales & Transaction Audit Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-6">
            <p className="text-sm text-muted leading-relaxed">
              Export line-item transaction records with bill numbers, cashier IDs, customer phone numbers, discounts, taxes, payment modes, and timestamps.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-border/80">
              <Input label="From Date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input label="To Date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={downloadSalesExport} size="md" className="font-semibold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Sales CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
