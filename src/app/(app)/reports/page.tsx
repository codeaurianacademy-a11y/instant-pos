"use client";

import { useState, useEffect, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format";

import { Select } from "@/components/ui/Select";

type DatePreset = "ALL" | "TODAY" | "YESTERDAY" | "LAST_7" | "THIS_MONTH" | "CUSTOM";

interface FinancialMetrics {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  totalDiscounts: number;
  totalBills: number;
  regularSalesCount: number;
  exchangeCount: number;
}

interface InventoryValuation {
  totalProducts: number;
  totalStockUnits: number;
  totalStockCostValue: number;
  totalStockRetailValue: number;
  potentialInventoryProfit: number;
  potentialInventoryMargin: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface TopProduct {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface CashierPerformance {
  id: string;
  name: string;
  username: string;
  billsCount: number;
  revenue: number;
}

interface ReportData {
  financials: FinancialMetrics;
  inventoryValuation: InventoryValuation;
  paymentBreakdown: Record<string, { count: number; total: number }>;
  topProducts: TopProduct[];
  cashierPerformance: CashierPerformance[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Date filters
  const [preset, setPreset] = useState<DatePreset>("TODAY");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const applyPreset = useCallback((p: DatePreset) => {
    setPreset(p);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (p === "ALL") {
      setFrom("");
      setTo("");
    } else if (p === "TODAY") {
      const dateStr = formatDate(today);
      setFrom(dateStr);
      setTo(dateStr);
    } else if (p === "YESTERDAY") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const dateStr = formatDate(y);
      setFrom(dateStr);
      setTo(dateStr);
    } else if (p === "LAST_7") {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      setFrom(formatDate(d));
      setTo(formatDate(today));
    } else if (p === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFrom(formatDate(firstDay));
      setTo(formatDate(today));
    }
  }, []);

  // Initial load with TODAY preset
  useEffect(() => {
    applyPreset("TODAY");
  }, [applyPreset]);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/reports/analytics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function downloadInventoryExport() {
    window.location.href = "/api/products/export";
  }

  function downloadSalesExport() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/sales/export?${params.toString()}`;
  }

  const fin = report?.financials;
  const inv = report?.inventoryValuation;

  const presetLabels: Record<DatePreset, string> = {
    TODAY: "Today",
    YESTERDAY: "Yesterday",
    LAST_7: "Last 7 Days",
    THIS_MONTH: "This Month",
    ALL: "All Time (Lifetime)",
    CUSTOM: "Custom Range",
  };

  return (
    <div className="flex flex-col gap-7 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-32">
      {/* 1. Header Banner with Enhanced Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Admin Analytics Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Financial Reports & Stock Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Real-time profit & loss accounting, live inventory valuation, top product margins, and audit CSV exports.
          </p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={downloadSalesExport}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <span>Export Sales CSV</span>
          </button>

          <button
            onClick={downloadInventoryExport}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <span>Export Stock CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Date Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Preset Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Period:</span>
          <div className="w-44">
            <Select
              value={preset}
              onChange={(val) => applyPreset(val as DatePreset)}
              className="h-9 shadow-none border-slate-200/80"
              options={[
                { label: "Today", value: "TODAY" },
                { label: "Yesterday", value: "YESTERDAY" },
                { label: "Last 7 Days", value: "LAST_7" },
                { label: "This Month", value: "THIS_MONTH" },
                { label: "All Time", value: "ALL" },
                { label: "Custom Range", value: "CUSTOM" },
              ]}
            />
          </div>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-3 flex-wrap bg-slate-50/50 p-2 rounded-xl border border-slate-200/80 shadow-inner overflow-hidden">
          <div className="flex items-center gap-2 text-xs px-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setPreset("CUSTOM");
                setFrom(e.target.value);
              }}
              className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer hover:border-slate-300"
            />
          </div>
          <div className="h-4 w-px bg-slate-300/80 hidden sm:block"></div>
          <div className="flex items-center gap-2 text-xs px-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setPreset("CUSTOM");
                setTo(e.target.value);
              }}
              className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer hover:border-slate-300"
            />
          </div>
          <button
            onClick={() => fetchReport()}
            title="Refresh"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <Spinner />
          <p className="text-xs font-semibold text-slate-400 animate-pulse">Calculating financial ledger...</p>
        </div>
      ) : !report ? (
        <div className="text-center py-16 text-slate-400 font-medium">No analytics data available</div>
      ) : (
        <>
          {/* 3. Live Inventory Valuation Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Live Inventory Valuation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Real-time
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Auto-syncs on every Stock In & Sale Out
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Total Stock in Store */}
              <div className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-500">
                    Total In-Stock Items
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {inv?.totalStockUnits.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">units</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100/80">
                  <span>Across <strong>{inv?.totalProducts}</strong> products</span>
                  {inv && inv.lowStockCount > 0 && (
                    <span className="font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      {inv.lowStockCount} low
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Purchase Value (Cost Capital) */}
              <div className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-500">
                    Purchase Cost (CP)
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600 group-hover:scale-105 transition-transform shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(inv?.totalStockCostValue ?? 0)}
                  </span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400 pt-3 border-t border-slate-100/80 truncate">
                  Total capital invested in stock
                </p>
              </div>

              {/* Stock Retail Value (MRP Turnover) */}
              <div className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-500">
                    Retail Value (MRP)
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(inv?.totalStockRetailValue ?? 0)}
                  </span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400 pt-3 border-t border-slate-100/80 truncate">
                  Estimated collection if all sold
                </p>
              </div>

              {/* Potential Inventory Profit */}
              <div className="group rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-4 sm:p-5 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 relative z-10">
                  <span className="text-sm font-semibold text-emerald-800">
                    Stock Potential Profit
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/60 text-emerald-700 group-hover:scale-105 transition-transform shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 relative z-10">
                  <span className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">
                    {formatCurrency(inv?.potentialInventoryProfit ?? 0)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-700/80 pt-3 border-t border-emerald-200/40 relative z-10">
                  <span>Gross Margin Potential</span>
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded shadow-2xs">
                    {inv?.potentialInventoryMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Financial P&L Section for Selected Period */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Sales Profitability & P&L Statement ({presetLabels[preset]})
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Net Profit = Net Sales Revenue − Cost of Goods Sold
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Signature Hero Net Realized Profit Card */}
              <div className="rounded-xl border border-emerald-400 bg-emerald-50/10 p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between relative z-10 gap-2">
                    <span className="text-sm font-semibold text-emerald-800">
                      Net Realized Profit
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0 shadow-2xs">
                      {fin?.profitMargin.toFixed(1)}% Margin
                    </span>
                  </div>
                  <div className="mt-2 relative z-10">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">
                      {formatCurrency(fin?.netProfit ?? 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200/40 flex items-center justify-between text-[11px] font-semibold text-emerald-700/80 relative z-10">
                  <span>Cost: <strong>{formatCurrency(fin?.totalCost ?? 0)}</strong></span>
                  <span>Sales: <strong>{formatCurrency(fin?.totalRevenue ?? 0)}</strong></span>
                </div>
              </div>

              {/* Net In-Hand Revenue */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-500">
                      Net In-Hand Revenue
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <span className="font-bold text-[13px]">₹</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {formatCurrency(fin?.totalRevenue ?? 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100/80 text-[11px] text-slate-400">
                  Actual money received after returns
                </div>
              </div>

              {/* Discounts Given */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-500">
                      Discounts Given
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl sm:text-2xl font-bold text-amber-600 tracking-tight">
                      {formatCurrency(fin?.totalDiscounts ?? 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100/80 text-[11px] text-slate-400">
                  Total concessions given to shoppers
                </div>
              </div>

              {/* Orders & Returns Count */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-500">
                      Orders & Invoices
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {fin?.totalBills}
                    </p>
                    <span className="text-xs font-semibold text-slate-400">bills</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span><strong>{fin?.regularSalesCount}</strong> Regular</span>
                  <span><strong>{fin?.exchangeCount}</strong> Exchanges</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Item-Wise Sales & Profit Performance Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Item-Wise Sales & Profit Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed profitability per item, sorted by highest gross profit generated.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 self-start sm:self-auto">
                {report.topProducts.length} Items Sold in Period
              </span>
            </div>

            <div className="overflow-x-auto">
              {report.topProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No product sales recorded in this period</p>
                  <p className="text-xs text-slate-400 mt-1">Try selecting a different date range or preset.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5 text-center w-12">#</th>
                      <th className="py-3 px-4">Item & SKU Code</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Qty Sold</th>
                      <th className="py-3 px-4 text-right">Cost Price (CP)</th>
                      <th className="py-3 px-4 text-right">Net Revenue</th>
                      <th className="py-3 px-5 text-right">Net Profit (₹)</th>
                      <th className="py-3 px-5 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {report.topProducts.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 text-center">
                          {idx === 0 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">🥇</span>
                          ) : idx === 1 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">🥈</span>
                          ) : idx === 2 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-800 text-xs font-bold">🥉</span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                          <span className="text-[11px] font-mono font-semibold text-slate-400 mt-0.5 block">{p.barcode}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-extrabold text-slate-900 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md text-xs">
                            {p.unitsSold}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono">
                          {formatCurrency(p.costPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900 font-mono">
                          {formatCurrency(p.revenue)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 font-mono text-base">
                          {formatCurrency(p.profit)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            p.margin >= 40
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : p.margin >= 20
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {p.margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 6. Payment Modes & Cashier Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Payment Modes Split */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    Payment Method Split
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">By Total Revenue</span>
              </div>

              <div className="flex flex-col gap-4">
                {Object.entries(report.paymentBreakdown).map(([mode, data]) => {
                  const percentage =
                    fin?.totalRevenue && fin.totalRevenue > 0
                      ? Math.max(0, (data.total / fin.totalRevenue) * 100)
                      : 0;

                  const colorStyles =
                    mode === "CASH"
                      ? { bg: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-50" }
                      : mode === "UPI"
                      ? { bg: "bg-purple-500", text: "text-purple-700", badge: "bg-purple-50" }
                      : mode === "CARD"
                      ? { bg: "bg-blue-500", text: "text-blue-700", badge: "bg-blue-50" }
                      : { bg: "bg-slate-500", text: "text-slate-700", badge: "bg-slate-50" };

                  return (
                    <div key={mode} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold ${colorStyles.badge} ${colorStyles.text}`}>
                            {mode}
                          </span>
                          <span className="text-slate-400 font-medium">{data.count} bills</span>
                        </div>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {formatCurrency(data.total)} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colorStyles.bg}`}
                          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cashier Performance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    Cashier & Sales Counters
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">Total Billed</span>
              </div>

              {report.cashierPerformance.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No cashier activity in this period.</p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {report.cashierPerformance.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white text-xs font-bold shadow-2xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{c.name}</p>
                          <span className="text-xs text-slate-400">@{c.username}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900 text-sm font-mono">{formatCurrency(c.revenue)}</p>
                        <span className="text-xs font-semibold text-slate-400">{c.billsCount} invoices</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
