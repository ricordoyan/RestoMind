"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Trophy,
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  BarChart3,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getMenu,
  getOrders,
  addOrders,
  clearOrders,
  newId,
  aggregateOrders,
  type MenuItem,
  type Order,
  type DishStat,
  type OrderTotals,
} from "@/lib/store";
import type { InsightsResponse } from "@/app/api/menu-insights/route";

// ─── helpers ────────────────────────────────────────────────────────────────

function parseBulkUpload(
  raw: string,
  menu: MenuItem[]
): { items: { name: string; qty: number; unitPrice: number }[]; parsed: number } {
  const menuByName = new Map(menu.map((m) => [m.name.trim().toLowerCase(), m]));
  const items: { name: string; qty: number; unitPrice: number }[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let name = "";
    let qty = 1;

    // "3 x Dish Name"  or  "3x Dish Name"
    const leadingQty = trimmed.match(/^(\d+)\s*[xX]\s+(.+?)(?:,\s*\d{4}-\d{2}-\d{2})?$/);
    if (leadingQty) {
      qty = parseInt(leadingQty[1], 10);
      name = leadingQty[2].trim();
    } else {
      // "Dish Name x3"  or  "Dish Name x 3"
      const trailingQty = trimmed.match(/^(.+?)\s+[xX]\s*(\d+)(?:,\s*\d{4}-\d{2}-\d{2})?$/);
      if (trailingQty) {
        name = trailingQty[1].trim();
        qty = parseInt(trailingQty[2], 10);
      } else {
        // "Dish Name, 3"  or  "Dish Name, 3, 2026-05-01"
        const commaSep = trimmed.match(/^(.+?),\s*(\d+)(?:,.*)?$/);
        if (commaSep) {
          name = commaSep[1].trim();
          qty = parseInt(commaSep[2], 10);
        } else {
          // plain dish name, qty defaults to 1
          // strip trailing date if present
          name = trimmed.replace(/,\s*\d{4}-\d{2}-\d{2}\s*$/, "").trim();
        }
      }
    }

    if (!name || !(qty > 0)) continue;

    const menuItem = menuByName.get(name.toLowerCase());
    const unitPrice = menuItem?.price ?? 0;
    items.push({ name: menuItem?.name ?? name, qty, unitPrice });
  }

  return { items, parsed: items.length };
}

function buildSampleOrders(menu: MenuItem[]): Order[] {
  if (menu.length === 0) return [];
  const orders: Order[] = [];
  for (let i = 0; i < 20; i++) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = Array.from({ length: numItems }, () => {
      const m = menu[Math.floor(Math.random() * menu.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      return { name: m.name, qty, unitPrice: m.price };
    });
    const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    orders.push({
      id: newId(),
      createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      source: "upload",
      items,
      total: Math.round(total * 100) / 100,
    });
  }
  return orders;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-emerald-400",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MarginBadge({ marginPct, hasCost }: { marginPct: number; hasCost: boolean }) {
  if (!hasCost) return <span className="text-slate-500 font-mono text-xs">—</span>;
  const color =
    marginPct >= 65
      ? "text-emerald-400 bg-emerald-500/10"
      : marginPct >= 50
        ? "text-amber-400 bg-amber-500/10"
        : "text-rose-400 bg-rose-500/10";
  return (
    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${color}`}>
      {marginPct.toFixed(1)}%
    </span>
  );
}

const QUADRANT_CONFIG = {
  star: {
    label: "Stars",
    icon: Star,
    headerColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    dotColor: "bg-emerald-400",
  },
  plowhorse: {
    label: "Plowhorses",
    icon: TrendingUp,
    headerColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    dotColor: "bg-amber-400",
  },
  puzzle: {
    label: "Puzzles",
    icon: Trophy,
    headerColor: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-indigo-500/5",
    dotColor: "bg-indigo-400",
  },
  dog: {
    label: "Dogs",
    icon: AlertTriangle,
    headerColor: "text-rose-400",
    borderColor: "border-rose-500/30",
    bgColor: "bg-rose-500/5",
    dotColor: "bg-rose-400",
  },
} as const;

type Category = keyof typeof QUADRANT_CONFIG;

// ─── page ────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishStats, setDishStats] = useState<DishStat[]>([]);
  const [totals, setTotals] = useState<OrderTotals>({
    totalOrders: 0,
    totalUnits: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    avgOrderValue: 0,
  });

  // Bulk upload
  const [uploadText, setUploadText] = useState("");
  const [parseMsg, setParseMsg] = useState("");

  // AI analysis
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<InsightsResponse | null>(null);
  const [aiError, setAiError] = useState("");

  // ── load / refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    const m = getMenu();
    const o = getOrders();
    setMenu(m);
    setOrders(o);
    const agg = aggregateOrders(o, m);
    setDishStats(agg.dishStats);
    setTotals(agg.totals);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
    refresh();
  }, [refresh]);

  // ── bulk upload ────────────────────────────────────────────────────────────
  const handleAddOrders = () => {
    const { items, parsed } = parseBulkUpload(uploadText, menu);
    if (parsed === 0) {
      setParseMsg("No valid lines found. Try: \"Margherita Pizza, 3\" or \"3 x Burger\".");
      return;
    }
    const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const order: Order = {
      id: newId(),
      createdAt: new Date().toISOString(),
      source: "upload",
      items,
      total: Math.round(total * 100) / 100,
    };
    addOrders([order]);
    setUploadText("");
    setParseMsg(`Parsed ${parsed} dish${parsed !== 1 ? "es" : ""}. Order added.`);
    refresh();
  };

  // ── sample data ───────────────────────────────────────────────────────────
  const handleLoadSample = () => {
    if (menu.length === 0) return;
    const sampleOrders = buildSampleOrders(menu);
    addOrders(sampleOrders);
    refresh();
  };

  // ── clear ─────────────────────────────────────────────────────────────────
  const handleClear = () => {
    if (!window.confirm("Clear all orders? This cannot be undone.")) return;
    clearOrders();
    setAiResult(null);
    setAiError("");
    refresh();
  };

  // ── AI analysis ──────────────────────────────────────────────────────────
  const handleRunAI = async () => {
    if (dishStats.length === 0) return;
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    try {
      const res = await fetch("/api/menu-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: dishStats, totals }),
      });
      const data = (await res.json()) as InsightsResponse & { error?: string };
      if (!res.ok || data.error) {
        setAiError(data.error ?? "AI analysis failed.");
      } else {
        setAiResult(data);
      }
    } catch {
      setAiError("Network error. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── chart data ────────────────────────────────────────────────────────────
  const top8Units = dishStats.slice(0, 8).map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 13) + "…" : d.name,
    units: d.units,
  }));

  const top8Profit = [...dishStats]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 8)
    .map((d) => ({
      name: d.name.length > 14 ? d.name.slice(0, 13) + "…" : d.name,
      profit: d.profit,
    }));

  const tooltipStyle = {
    contentStyle: {
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: 8,
      color: "#e2e8f0",
    },
  };

  const hasOrders = orders.length > 0;

  // ── grouped quadrants ─────────────────────────────────────────────────────
  const grouped = aiResult
    ? (["star", "plowhorse", "puzzle", "dog"] as Category[]).map((cat) => ({
        cat,
        items: aiResult.classification.filter((c) => c.category === cat),
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white shrink-0"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400 shrink-0" />
            <h1 className="font-bold text-base sm:text-lg">Menu Engineering Insights</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {menu.length === 0 && (
            <Link href="/menu-setup" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
              Set up menu →
            </Link>
          )}
          <Link href="/phone-agent" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 hidden sm:inline">
            Phone agent
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Menu + margin hint */}
        {menu.length === 0 && (
          <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-300">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Your menu is empty — profit margin calculations require cost data.{" "}
              <Link href="/menu-setup" className="underline underline-offset-2 font-semibold">
                Set up your menu
              </Link>{" "}
              first, then upload orders or use the{" "}
              <Link href="/phone-agent" className="underline underline-offset-2 font-semibold">
                phone agent
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {!hasOrders && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">No order data yet</h2>
                <p className="text-sm text-slate-400 max-w-sm">
                  Upload a batch of orders below, load sample data to explore the dashboard, or
                  take live orders via the{" "}
                  <Link href="/phone-agent" className="text-emerald-400 underline underline-offset-2">
                    phone agent
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk upload card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5 text-indigo-400" />
              Bulk Upload Orders
            </CardTitle>
            <CardDescription>
              Paste one dish per line. Accepted formats:{" "}
              <code className="text-slate-300 text-xs">Margherita Pizza, 3</code> ·{" "}
              <code className="text-slate-300 text-xs">Margherita Pizza x3</code> ·{" "}
              <code className="text-slate-300 text-xs">3 x Margherita Pizza</code>. Trailing
              date column is ignored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-upload" className="text-slate-400 text-xs">
                Order lines
              </Label>
              <Textarea
                id="bulk-upload"
                rows={5}
                placeholder={"Margherita Pizza, 3\nGrilled Salmon x2\n3 x Caesar Salad\nTiramisu"}
                className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 font-mono text-sm resize-none"
                value={uploadText}
                onChange={(e) => {
                  setUploadText(e.target.value);
                  setParseMsg("");
                }}
              />
            </div>
            {parseMsg && (
              <p className="text-xs text-emerald-400">{parseMsg}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAddOrders}
                disabled={!uploadText.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add orders
              </Button>
              <Button
                variant="outline"
                onClick={handleLoadSample}
                disabled={menu.length === 0}
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                title={menu.length === 0 ? "Set up a menu first" : "Load 20 random sample orders"}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Load sample data
              </Button>
              {hasOrders && (
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear all orders
                </Button>
              )}
            </div>
            {menu.length === 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Set up your menu first so that unit prices and margin calculations are accurate.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary stat cards */}
        {hasOrders && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              label="Total Orders"
              value={totals.totalOrders.toLocaleString()}
              icon={BarChart3}
              color="text-indigo-400"
            />
            <StatCard
              label="Items Sold"
              value={totals.totalUnits.toLocaleString()}
              icon={TrendingUp}
              color="text-sky-400"
            />
            <StatCard
              label="Revenue"
              value={`$${totals.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="text-emerald-400"
            />
            <StatCard
              label="Profit"
              value={`$${totals.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={Trophy}
              color="text-amber-400"
            />
            <StatCard
              label="Avg Order Value"
              value={`$${totals.avgOrderValue.toFixed(2)}`}
              icon={Star}
              color="text-violet-400"
            />
          </div>
        )}

        {/* Charts */}
        {dishStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Units chart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Top Dishes by Units Sold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={top8Units} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        {...tooltipStyle}
                        formatter={(v) => [v as number, "Units"]}
                      />
                      <Bar dataKey="units" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Profit chart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-400" />
                  Top Dishes by Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={top8Profit} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        {...tooltipStyle}
                        formatter={(v) => [`$${Number(v).toFixed(2)}`, "Profit"]}
                      />
                      <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Most-Ordered table */}
        {dishStats.length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-amber-400" />
                Most-Ordered Dishes
              </CardTitle>
              <CardDescription>Ranked by units sold. Margin benchmark: 65%.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-3 text-slate-500 font-medium w-10">#</th>
                      <th className="text-left py-3 px-3 text-slate-500 font-medium">Dish</th>
                      <th className="text-center py-3 px-3 text-slate-500 font-medium">Units</th>
                      <th className="text-right py-3 px-3 text-slate-500 font-medium">Revenue</th>
                      <th className="text-center py-3 px-3 text-slate-500 font-medium">Margin</th>
                      <th className="text-right py-3 px-3 text-slate-500 font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dishStats.map((d, i) => (
                      <tr
                        key={d.name}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-3 text-slate-600 font-mono text-xs">{i + 1}</td>
                        <td className="py-3 px-3 font-medium text-white">{d.name}</td>
                        <td className="py-3 px-3 text-center text-slate-300">{d.units}</td>
                        <td className="py-3 px-3 text-right text-slate-300">
                          ${d.revenue.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <MarginBadge marginPct={d.marginPct} hasCost={d.hasCost} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          {d.hasCost ? (
                            <span className="text-emerald-400">${d.profit.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        {hasOrders && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400" />
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    AI Menu Engineering
                  </CardTitle>
                  <CardDescription>
                    GPT-4o classifies each dish into the Star / Plowhorse / Puzzle / Dog matrix.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleRunAI}
                  disabled={aiLoading || dishStats.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analysing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Run AI Menu Engineering
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            {aiError && (
              <CardContent>
                <Alert className="bg-rose-500/10 border-rose-500/30 text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{aiError}</AlertDescription>
                </Alert>
              </CardContent>
            )}

            {aiResult && (
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <p className="text-sm text-slate-300 leading-relaxed">{aiResult.summary}</p>
                </div>

                {/* 4-quadrant classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {grouped.map(({ cat, items }) => {
                    const cfg = QUADRANT_CONFIG[cat];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={cat}
                        className={`rounded-xl border p-4 ${cfg.bgColor} ${cfg.borderColor}`}
                      >
                        <h3
                          className={`font-semibold text-sm flex items-center gap-2 mb-3 ${cfg.headerColor}`}
                        >
                          <Icon className="w-4 h-4" />
                          {cfg.label}
                          <span className="ml-auto font-mono text-xs opacity-70">
                            {items.length}
                          </span>
                        </h3>
                        {items.length === 0 ? (
                          <p className="text-slate-600 text-xs italic">None</p>
                        ) : (
                          <ul className="space-y-2">
                            {items.map((c) => (
                              <li key={c.name} className="text-xs">
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`mt-1 shrink-0 w-2 h-2 rounded-full ${cfg.dotColor}`}
                                  />
                                  <div>
                                    <span className="font-semibold text-white">{c.name}</span>
                                    <p className="text-slate-400 leading-snug mt-0.5">{c.reason}</p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                {aiResult.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {aiResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pricing actions */}
                {aiResult.pricingActions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-indigo-400" />
                      Pricing Actions
                    </h3>
                    <div className="space-y-2">
                      {aiResult.pricingActions.map((pa, i) => (
                        <div
                          key={i}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="font-semibold text-white text-sm">{pa.name}</span>
                            <span className="text-indigo-400 text-xs font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                              {pa.action}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{pa.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top opportunities */}
                {aiResult.topOpportunities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      Top Opportunities
                    </h3>
                    <ul className="space-y-2">
                      {aiResult.topOpportunities.map((op, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{op}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
