"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemStatus = "critical" | "low" | "ok";

type ComputedItem = {
  name: string;
  unit: string;
  currentStock: number;
  parLevel: number;
  orderQty: number;
  status: ItemStatus;
  unitCost: number | null;
  lineOrderCost: number | null;
  supplier: string | null;
};

type UrgentItem = {
  name: string;
  reason: string;
};

type ParLevelAdvice = {
  item: string;
  suggestedPar: number;
  rationale: string;
};

type OrderingScheduleEntry = {
  day: string;
  focus: string;
  note: string;
};

type InventoryReportData = {
  summary: string;
  urgentItems: UrgentItem[];
  parLevelAdvice: ParLevelAdvice[];
  orderingSchedule: OrderingScheduleEntry[];
  wasteReductionTips: string[];
  supplierTips: string[];
  computed: {
    items: ComputedItem[];
    itemsToOrder: number;
    lowStockCount: number;
    criticalCount: number;
    totalOrderCost: number | null;
  };
  meta: {
    cuisine: string | null;
    itemCount: number;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadInventoryReport(id: string): { data: InventoryReportData | null; error: string } {
  try {
    const saved = localStorage.getItem(`inventory_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as InventoryReportData, error: "" };
    return { data: null, error: "Inventory report not found. Please run a new analysis." };
  } catch {
    return { data: null, error: "Failed to load inventory report data." };
  }
}

function statusBadge(status: ItemStatus) {
  const cfg = {
    critical: {
      label: "Critical",
      className: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    },
    low: {
      label: "Low",
      className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    },
    ok: {
      label: "OK",
      className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    },
  };
  const { label, className } = cfg[status];
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${className}`}
    >
      {label}
    </span>
  );
}

function fmtCost(cost: number | null): string {
  if (cost === null) return "—";
  return `$${cost.toFixed(2)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: InventoryReportData | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadInventoryReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/inventory")}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your inventory report...</p>
        </div>
      </div>
    );
  }

  const { computed, meta } = data;
  const hasCosts = computed.totalOrderCost !== null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/inventory")}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-400 shrink-0" />
            <h1 className="font-bold text-base sm:text-lg truncate">Inventory Report</h1>
          </div>
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">
          {meta.itemCount} item{meta.itemCount !== 1 ? "s" : ""}
          {meta.cuisine ? ` · ${meta.cuisine}` : ""}
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5 text-sky-400" /> Items to Order
              </p>
              <p className="text-2xl font-bold text-white">{computed.itemsToOrder}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Low Stock
              </p>
              <p className="text-2xl font-bold text-amber-400">{computed.lowStockCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Critical
              </p>
              <p className="text-2xl font-bold text-rose-400">{computed.criticalCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" /> Total Order Cost
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                {hasCosts ? `$${computed.totalOrderCost!.toFixed(2)}` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Summary */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-sky-500 to-blue-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Package className="text-sky-400 w-5 h-5" /> Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{data.summary}</p>
          </CardContent>
        </Card>

        {/* Order List Table */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-sky-500 to-blue-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ShoppingCart className="text-sky-400 w-5 h-5" /> Order List
            </CardTitle>
            <CardDescription>
              Items below par level are highlighted. Order Qty = Par − Current Stock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium w-[22%]">Item</th>
                    <th className="text-center py-3 px-4 text-slate-500 font-medium w-[18%]">
                      Stock (cur / par)
                    </th>
                    <th className="text-center py-3 px-4 text-slate-500 font-medium w-[14%]">
                      Order Qty
                    </th>
                    <th className="text-center py-3 px-4 text-slate-500 font-medium w-[13%]">
                      Est. Cost
                    </th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium w-[18%]">
                      Supplier
                    </th>
                    <th className="text-center py-3 px-4 text-slate-500 font-medium w-[11%]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {computed.items.map((item, i) => {
                    const needsOrder = item.orderQty > 0;
                    const rowClass =
                      item.status === "critical"
                        ? "border-b border-slate-800/50 bg-rose-500/5 hover:bg-rose-500/10 transition-colors"
                        : item.status === "low"
                          ? "border-b border-slate-800/50 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                          : "border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors";
                    return (
                      <tr key={i} className={rowClass}>
                        <td className="py-3 px-4 font-medium text-white">{item.name}</td>
                        <td className="py-3 px-4 text-center text-slate-300 font-mono text-xs">
                          {item.currentStock}{" "}
                          <span className="text-slate-600">/</span>{" "}
                          {item.parLevel}{" "}
                          <span className="text-slate-500">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {needsOrder ? (
                            <span className="font-semibold text-sky-400">
                              {item.orderQty} <span className="text-slate-500 font-normal text-xs">{item.unit}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300 font-mono text-xs">
                          {fmtCost(item.lineOrderCost)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {item.supplier ?? <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">{statusBadge(item.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Items */}
        {data.urgentItems.length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-rose-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-rose-400">
                <AlertTriangle className="w-5 h-5" /> Urgent Items
              </CardTitle>
              <CardDescription>Items requiring immediate attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.urgentItems.map((item, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Par-Level Advice */}
        {data.parLevelAdvice.length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-sky-500 to-blue-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingDown className="text-sky-400 w-5 h-5" /> Par-Level Recommendations
              </CardTitle>
              <CardDescription>
                Suggested par adjustments based on current stock patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.parLevelAdvice.map((advice, i) => {
                  const currentItem = computed.items.find(
                    (ci) => ci.name.toLowerCase() === advice.item.toLowerCase()
                  );
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white truncate">{advice.item}</p>
                        <span className="text-xs text-slate-500 shrink-0">
                          {currentItem ? (
                            <>
                              <span className="text-slate-400">{currentItem.parLevel}</span>
                              <span className="mx-1 text-slate-600">→</span>
                              <span className="text-sky-400 font-semibold">{advice.suggestedPar}</span>
                            </>
                          ) : (
                            <span className="text-sky-400 font-semibold">
                              Par: {advice.suggestedPar}
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{advice.rationale}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ordering Schedule */}
        {data.orderingSchedule.length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ShoppingCart className="text-blue-400 w-5 h-5" /> Ordering Schedule
              </CardTitle>
              <CardDescription>Recommended weekly ordering cadence.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.orderingSchedule.map((entry, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      {entry.day}
                    </p>
                    <p className="text-sm font-semibold text-white">{entry.focus}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{entry.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waste Reduction + Supplier Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {data.wasteReductionTips.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" /> Waste Reduction Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.wasteReductionTips.map((tip, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.supplierTips.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 to-blue-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-sky-400">
                  <Package className="w-5 h-5" /> Supplier Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.supplierTips.map((tip, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

      </main>
    </div>
  );
}
