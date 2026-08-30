"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface TransactionItem {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { id: string; name: string; barcode: string };
}

interface EditHistorySnapshot {
  editedAt: string;
  editedBy: string;
  previousGrandTotal: number;
  previousDiscountTotal: number;
  previousTaxTotal: number;
  previousSubtotal: number;
  previousPaymentMethod: string | null;
  previousCustomer: { name: string; phone: string } | null;
  previousItems: {
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    lineDiscount: number;
    lineTotal: number;
  }[];
}

interface TransactionSale {
  id: string;
  billNumber: string;
  type: "SALE" | "EXCHANGE";
  status: "COMPLETED" | "VOIDED" | "DRAFT";
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: string | null;
  amountPaid: number | null;
  completedAt: string;
  isEdited?: boolean;
  editHistory?: unknown;
  customer: { name: string; phone: string | null } | null;
  cashier: { name: string; username: string };
  items: TransactionItem[];
  originalSale: { id: string; billNumber: string } | null;
  exchangedInto: { id: string; billNumber: string } | null;
}

interface Metrics {
  totalAmount: number;
  totalDiscounts: number;
  totalBills: number;
  regularSalesCount?: number;
  pureReturnsCount?: number;
  exchangeWithNewItemsCount?: number;
  totalExchanges: number;
}

type DatePreset = "ALL" | "TODAY" | "YESTERDAY" | "LAST_7" | "THIS_MONTH" | "CUSTOM";

export default function TransactionsPage() {
  const [sales, setSales] = useState<TransactionSale[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ totalAmount: 0, totalDiscounts: 0, totalBills: 0, totalExchanges: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [quickDatePreset, setQuickDatePreset] = useState<DatePreset>("ALL");

  // Pagination & user
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Expanded edit audit histories
  const [expandedEdits, setExpandedEdits] = useState<Record<string, boolean>>({});

  function toggleEditHistory(id: string) {
    setExpandedEdits((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.user?.role ?? null);
        }
      } catch {
        // ignore
      }
    }
    fetchUser();
  }, []);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/sales/list?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSales(data.sales ?? []);
        setMetrics(data.metrics ?? { totalAmount: 0, totalDiscounts: 0, totalBills: 0, totalExchanges: 0 });
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, fromDate, toDate, typeFilter, statusFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [search, fromDate, toDate, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSales]);

  function applyDatePreset(preset: "ALL" | "TODAY" | "YESTERDAY" | "LAST_7" | "THIS_MONTH") {
    setQuickDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "ALL") {
      setFromDate("");
      setToDate("");
    } else if (preset === "TODAY") {
      const dateStr = formatDate(today);
      setFromDate(dateStr);
      setToDate(dateStr);
    } else if (preset === "YESTERDAY") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const dateStr = formatDate(y);
      setFromDate(dateStr);
      setToDate(dateStr);
    } else if (preset === "LAST_7") {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      setFromDate(formatDate(d));
      setToDate(formatDate(today));
    } else if (preset === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(today));
    }
  }

  function downloadCsv() {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    window.location.href = `/api/sales/export?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Detailed Transactions & Sales</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Search, filter, and audit every customer invoice, exchange record, and payment across your store.
          </p>
        </div>
        {userRole === "ADMIN" && (
          <Button onClick={downloadCsv} variant="secondary" size="md" className="font-semibold self-start sm:self-auto gap-2">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </Button>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {userRole === "ADMIN" ? (
          <>
            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">Total Sales</span>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                {formatCurrency(metrics.totalAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">Invoices Count</span>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                {metrics.totalBills}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">Exchanges Done</span>
              <p className="text-xl sm:text-2xl font-extrabold text-blue-600 mt-1">
                {metrics.totalExchanges}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">Discounts & Credits</span>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                {formatCurrency(metrics.totalDiscounts)}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider block">Total Invoices</span>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                {metrics.totalBills}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Regular Sales</span>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                {metrics.regularSalesCount ?? Math.max(0, metrics.totalBills - metrics.totalExchanges)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Exchanges Done</span>
              <p className="text-xl sm:text-2xl font-extrabold text-blue-600 mt-1">
                {metrics.exchangeWithNewItemsCount ?? metrics.totalExchanges}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block">Returns Done</span>
              <p className="text-xl sm:text-2xl font-extrabold text-red-600 mt-1">
                {metrics.pureReturnsCount ?? 0}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search by Customer Name, Mobile Number (9876..), Bill Number (#1234), or Item title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-slate-50/50 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
          />
        </div>

        {/* Quick Date Range Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/70">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mr-1">Quick Date:</span>
          {(
            [
              { key: "ALL", label: "All Time" },
              { key: "TODAY", label: "Today" },
              { key: "YESTERDAY", label: "Yesterday" },
              { key: "LAST_7", label: "Last 7 Days" },
              { key: "THIS_MONTH", label: "This Month" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => applyDatePreset(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                quickDatePreset === item.key
                  ? "bg-accent text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers & Type Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/70">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setQuickDatePreset("CUSTOM");
                setFromDate(e.target.value);
              }}
              className="w-full h-9 px-3 rounded-lg border border-border bg-white text-xs text-foreground focus:ring-1 focus:ring-accent outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setQuickDatePreset("CUSTOM");
                setToDate(e.target.value);
              }}
              className="w-full h-9 px-3 rounded-lg border border-border bg-white text-xs text-foreground focus:ring-1 focus:ring-accent outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">Sale Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-border bg-white text-xs font-medium text-foreground focus:ring-1 focus:ring-accent outline-none"
            >
              <option value="ALL">All Types (Sales & Exchanges)</option>
              <option value="SALE">Regular Sales Only</option>
              <option value="EXCHANGE">Exchange Invoices Only</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-border bg-white text-xs font-medium text-foreground focus:ring-1 focus:ring-accent outline-none"
            >
              <option value="ALL">Completed & Active</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="VOIDED">Voided / Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <EmptyState
            title="No transactions found"
            description="No sales matched your search or date criteria. Try resetting filters."
          />
        </div>
      ) : (() => {
        const totalPages = Math.ceil(sales.length / PAGE_SIZE);
        const pageSales = sales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        return (
          <div className="flex flex-col gap-3">
            {/* Count + Page Info */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted">
                Found {sales.length} transaction{sales.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sales.length)} of {sales.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
              {pageSales.map((sale) => {
                const hasName = sale.customer?.name && sale.customer.name.trim() !== "" && sale.customer.name.trim() !== "Walk-in" && sale.customer.name.trim() !== "Customer";
                const hasPhone = sale.customer?.phone && sale.customer.phone.trim() !== "" && !sale.customer.phone.startsWith("phone_") && !sale.customer.phone.startsWith("temp_");

                const displayName = hasName
                  ? sale.customer!.name
                  : hasPhone
                    ? `Phone: ${sale.customer!.phone}`
                    : "Walk-in Customer";

                const shortBillNo = sale.billNumber.length > 10
                  ? `Bill #${sale.billNumber.slice(-8).toUpperCase()}`
                  : `Bill #${sale.billNumber}`;

                const canExchange = sale.status === "COMPLETED" && !sale.exchangedInto;
                const canEdit = sale.status === "COMPLETED" && !sale.exchangedInto;
                const historyList = (Array.isArray(sale.editHistory) ? sale.editHistory : []) as EditHistorySnapshot[];
                const isExpanded = !!expandedEdits[sale.id];

                return (
                  <div
                    key={sale.id}
                    className={`p-4 sm:p-5 transition-all flex flex-col gap-3 ${
                      sale.isEdited
                        ? "bg-amber-50/30 border-l-4 border-l-amber-500 hover:bg-amber-50/50"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Top Row: Customer, Meta & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/sales/${sale.id}`}
                            className="text-base font-bold text-foreground hover:text-accent transition-colors"
                          >
                            {displayName}
                          </Link>

                          {hasPhone && (
                            <span className="text-xs font-mono bg-blue-50 text-accent font-semibold px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {sale.customer!.phone}
                            </span>
                          )}

                          {sale.type === "EXCHANGE" && (
                            <Badge tone={sale.items.length === 0 ? "danger" : "accent"}>
                              {sale.items.length === 0 ? "Return" : "Exchange"}
                            </Badge>
                          )}
                          {sale.status === "VOIDED" && <Badge tone="danger">Voided</Badge>}
                          {sale.isEdited && (
                            <Badge tone="warning">Edited / Revised</Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-slate-700">{shortBillNo}</span>
                          <span>•</span>
                          <span>{formatDateTime(sale.completedAt)}</span>
                          <span>•</span>
                          <span>Cashier: <strong>{sale.cashier.name}</strong></span>
                          {sale.paymentMethod && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                {sale.paymentMethod}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Right: Amount + Instant Action Buttons */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-lg font-extrabold text-foreground">
                          {formatCurrency(sale.grandTotal)}
                        </p>
                        {sale.discountTotal > 0 && (
                          <p className="text-[11px] text-emerald-600 font-medium">
                            Credit: -{formatCurrency(sale.discountTotal)}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-end">
                          <Link href={`/sales/${sale.id}`}>
                            <button
                              type="button"
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Bill
                            </button>
                          </Link>

                          {canEdit && (
                            <Link href={`/sales/${sale.id}/edit`}>
                              <button
                                type="button"
                                className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Bill
                              </button>
                            </Link>
                          )}

                          {canExchange ? (
                            <Link href={`/sales/${sale.id}/exchange`}>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                </svg>
                                Return / Exchange
                              </button>
                            </Link>
                          ) : sale.exchangedInto ? (
                            <span className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
                              Already Returned
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs text-slate-700 flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                        {sale.items.length} Item{sale.items.length !== 1 ? "s" : ""}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {sale.items.map((item) => (
                          <span key={item.id} className="bg-white px-2 py-1 rounded-md border border-border shadow-2xs text-[11px]">
                            <strong>{item.quantity}×</strong> {item.product.name}{" "}
                            <span className="text-muted">({formatCurrency(item.unitPrice)})</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Edit History Audit Toggle (Previous vs Updated) */}
                    {sale.isEdited && historyList.length > 0 && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => toggleEditHistory(sale.id)}
                          className="text-xs font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg border border-amber-300/80 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <span>📝</span>
                          <span>Bill Edit History ({historyList.length} revision{historyList.length > 1 ? "s" : ""}) — Click to compare Original vs Updated</span>
                          <span className="ml-auto font-mono">{isExpanded ? "▲ Hide" : "▼ View"}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 rounded-xl border-2 border-amber-300/80 bg-white p-3.5 text-xs shadow-xs flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left: Previous Original Bill */}
                              {historyList.map((hist, idx) => (
                                <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex flex-col gap-2">
                                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 font-bold text-slate-700">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-500">
                                      Revision #{idx + 1} (Before Edit)
                                    </span>
                                    <span className="text-[11px] text-slate-500">{formatDateTime(hist.editedAt)}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">Edited by: <strong>{hist.editedBy}</strong></p>
                                  <div className="flex justify-between font-bold text-sm">
                                    <span>Original Total:</span>
                                    <span className="line-through text-slate-600">{formatCurrency(hist.previousGrandTotal)}</span>
                                  </div>
                                  <div className="border-t border-slate-200/80 pt-1.5">
                                    <p className="font-semibold text-[11px] text-slate-600 mb-1">Previous Items:</p>
                                    <ul className="divide-y divide-slate-200/50 text-[11px]">
                                      {hist.previousItems.map((item, itemIdx) => (
                                        <li key={itemIdx} className="py-1 flex justify-between">
                                          <span>{item.quantity}× {item.productName}</span>
                                          <span className="font-mono text-slate-600">{formatCurrency(item.lineTotal)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              ))}

                              {/* Right: Current Updated Bill */}
                              <div className="rounded-lg border-2 border-emerald-500/40 bg-emerald-50/30 p-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between border-b border-emerald-200 pb-1 font-bold text-emerald-900">
                                  <span className="text-[11px] uppercase tracking-wider text-emerald-700">
                                    Current Bill (After Edit)
                                  </span>
                                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">Active</span>
                                </div>
                                <div className="flex justify-between font-extrabold text-sm text-emerald-900">
                                  <span>Current Total:</span>
                                  <span className="text-base font-black text-emerald-700">{formatCurrency(sale.grandTotal)}</span>
                                </div>
                                <div className="border-t border-emerald-200/80 pt-1.5">
                                  <p className="font-semibold text-[11px] text-emerald-800 mb-1">Current Items:</p>
                                  <ul className="divide-y divide-emerald-200/50 text-[11px]">
                                    {sale.items.map((item) => (
                                      <li key={item.id} className="py-1 flex justify-between font-medium">
                                        <span>{item.quantity}× {item.product.name}</span>
                                        <span className="font-mono font-bold text-emerald-800">{formatCurrency(item.lineTotal)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Exchange / Return reference links */}
                    {(sale.originalSale || sale.exchangedInto) && (
                      <div className="text-[11px] text-muted border-t border-slate-100 pt-2">
                        {sale.originalSale && (
                          <span className="text-blue-700 font-medium">
                            ↩ Exchanged against original #{sale.originalSale.billNumber.slice(-8).toUpperCase()}
                          </span>
                        )}
                        {sale.exchangedInto && (
                          <span className="text-amber-700 font-medium">
                            ↪ Items returned via #{sale.exchangedInto.billNumber.slice(-8).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-lg border border-border bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-accent text-white shadow-xs"
                        : "border border-border bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-lg border border-border bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
