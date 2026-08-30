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
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted">Export inventory and sales data as CSV.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory export</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted">
            All active products with name, barcode, category, cost, price, and stock — in the same
            format used for CSV import.
          </p>
          <Button onClick={downloadInventoryExport} className="shrink-0 ml-4">
            Download CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            One row per item sold across completed bills, with bill number, customer, cashier, and
            payment details. Leave dates blank to export full history.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={downloadSalesExport} className="self-start">
            Download CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
