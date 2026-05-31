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
  ChefHat,
  DollarSign,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

// ---- Contract types -------------------------------------------------------

type IngredientResult = {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  share: number;
};

type ComputedData = {
  totalCost: number;
  costPerServing: number;
  foodCostPercent: number;
  grossProfitPerServing: number;
  marginPercent: number;
  sellingPrice: number;
  servings: number;
  targetFoodCostPct: number;
  priceForTargetFoodCost: number;
  ingredients: IngredientResult[];
};

type CostReductionItem = {
  ingredient: string;
  suggestion: string;
  estimatedSaving: string;
};

type ExpensiveIngredient = {
  name: string;
  note: string;
};

type RecipeCostData = {
  verdict: "healthy" | "watch" | "high_cost";
  assessment: string;
  costReduction: CostReductionItem[];
  expensiveIngredients: ExpensiveIngredient[];
  pricingAdvice: {
    recommendedPrice: number;
    rationale: string;
  };
  portioningTips: string[];
  supplierTips: string[];
  computed: ComputedData;
  meta: {
    dishName: string;
    cuisine: string | null;
  };
};

// ---- Helpers --------------------------------------------------------------

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

function fmt2(n: unknown): string {
  return safeNum(n).toFixed(2);
}

function fmt1(n: unknown): string {
  return safeNum(n).toFixed(1);
}

function loadReport(id: string): { data: RecipeCostData | null; error: string } {
  try {
    const saved = localStorage.getItem(`recipe_cost_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as RecipeCostData, error: "" };
    return { data: null, error: "Report not found. Please run a new analysis." };
  } catch {
    return { data: null, error: "Failed to load recipe cost report data." };
  }
}

// ---- Verdict config -------------------------------------------------------

const VERDICT_CONFIG = {
  healthy: {
    label: "Healthy Cost",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  watch: {
    label: "Watch Cost",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  high_cost: {
    label: "High Cost",
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
} as const;

// ---- Sub-components -------------------------------------------------------

function FoodCostRing({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * clamped) / 100;

  const strokeClass =
    pct <= 35 ? "stroke-emerald-500" : pct <= 45 ? "stroke-amber-500" : "stroke-rose-500";
  const textColor =
    pct <= 35 ? "text-emerald-400" : pct <= 45 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-800"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={`${strokeClass} transition-all duration-1000 ease-out`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-3xl sm:text-4xl font-black ${textColor}`}>
          {fmt1(pct)}%
        </span>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest">food cost</span>
      </div>
    </div>
  );
}

function ShareBar({ share }: { share: number }) {
  const pct = Math.min(100, Math.max(0, safeNum(share)));
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-lime-500 to-green-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 font-mono w-9 text-right">{fmt1(pct)}%</span>
    </div>
  );
}

// ---- Page -----------------------------------------------------------------

export default function RecipeCostReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: RecipeCostData | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/recipe-cost")}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your food cost report...</p>
        </div>
      </div>
    );
  }

  const { computed, meta } = data;
  const verdictKey = data.verdict in VERDICT_CONFIG ? data.verdict : "watch";
  const vcfg = VERDICT_CONFIG[verdictKey];
  const VIcon = vcfg.icon;

  const sortedIngredients = [...(computed.ingredients ?? [])].sort(
    (a, b) => safeNum(b.share) - safeNum(a.share)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/recipe-cost")}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-base sm:text-lg truncate">{meta.dishName}</h1>
            {meta.cuisine && (
              <p className="text-xs text-slate-500 hidden sm:block">{meta.cuisine}</p>
            )}
          </div>
        </div>
        <span className="hidden sm:block text-xs text-slate-500">
          Food Cost: {fmt1(computed.foodCostPercent)}% &middot; Margin:{" "}
          {fmt1(computed.marginPercent)}%
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Page hero row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center shrink-0">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {meta.dishName}
              {meta.cuisine ? ` — ${meta.cuisine}` : ""}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">{data.assessment}</p>
          </div>
        </div>

        {/* Hero metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Food cost ring */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col items-center justify-center py-6">
            <CardContent className="flex flex-col items-center p-0 gap-3">
              <FoodCostRing pct={safeNum(computed.foodCostPercent)} />
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${vcfg.color} ${vcfg.bg} border ${vcfg.border}`}
              >
                <VIcon className="w-3.5 h-3.5" /> {vcfg.label}
              </span>
            </CardContent>
          </Card>

          {/* Key figures */}
          <Card className="bg-slate-900 border-slate-800 md:col-span-2">
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-lime-400" /> Selling Price
                </p>
                <p className="text-2xl font-bold text-white">
                  ${fmt2(computed.sellingPrice)}
                </p>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Cost / Serving
                </p>
                <p className="text-2xl font-bold text-white">
                  ${fmt2(computed.costPerServing)}
                </p>
                {safeNum(computed.servings) > 1 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {computed.servings} servings · total ${fmt2(computed.totalCost)}
                  </p>
                )}
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Gross Profit/Serving
                </p>
                <p
                  className={`text-2xl font-bold ${
                    safeNum(computed.grossProfitPerServing) >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  ${fmt2(computed.grossProfitPerServing)}
                </p>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Margin %</p>
                <p
                  className={`text-2xl font-bold ${
                    safeNum(computed.marginPercent) >= 65
                      ? "text-emerald-400"
                      : safeNum(computed.marginPercent) >= 50
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {fmt1(computed.marginPercent)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ingredient cost breakdown */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-lime-500 to-green-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ChefHat className="text-lime-400 w-5 h-5" /> Ingredient Cost Breakdown
            </CardTitle>
            <CardDescription>
              Sorted by cost share — highest contributors first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedIngredients.length === 0 ? (
              <p className="text-slate-400 text-sm">No ingredient data available.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">
                        Ingredient
                      </th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">
                        Qty
                      </th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">
                        Cost
                      </th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium w-[180px]">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIngredients.map((ing, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-medium text-white">{ing.name}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {safeNum(ing.quantity) > 0
                            ? `${ing.quantity} ${ing.unit}`
                            : ing.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          ${fmt2(ing.cost)}
                        </td>
                        <td className="py-2.5 px-3">
                          <ShareBar share={ing.share} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700">
                      <td className="py-2.5 px-3 font-bold text-white">Total</td>
                      <td />
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        ${fmt2(computed.totalCost)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expensive ingredients flags */}
        {(data.expensiveIngredients ?? []).length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-amber-400">
                <AlertTriangle className="w-5 h-5" /> Expensive Ingredient Flags
              </CardTitle>
              <CardDescription>
                High-cost ingredients that may be hurting your margins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.expensiveIngredients.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                  >
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing advice */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-lime-500 to-green-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <DollarSign className="text-lime-400 w-5 h-5" /> Pricing Advice
            </CardTitle>
            <CardDescription>
              AI-recommended price targeting a healthy {computed.targetFoodCostPct}% food cost.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col gap-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  AI Recommended Price
                </p>
                <p className="text-4xl font-black text-lime-400">
                  ${fmt2(data.pricingAdvice?.recommendedPrice)}
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {data.pricingAdvice?.rationale ?? ""}
                </p>
              </div>
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col gap-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Price for {computed.targetFoodCostPct}% Target
                </p>
                <p className="text-4xl font-black text-green-400">
                  ${fmt2(computed.priceForTargetFoodCost)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Selling at this price achieves exactly your {computed.targetFoodCostPct}% food
                  cost target.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost-reduction suggestions */}
        {(data.costReduction ?? []).length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingDown className="text-emerald-400 w-5 h-5" /> Cost-Reduction Opportunities
              </CardTitle>
              <CardDescription>
                Actionable changes to lower your food cost per serving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.costReduction.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-start gap-2"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{item.ingredient}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.suggestion}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 self-start">
                      {item.estimatedSaving}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portioning & supplier tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {(data.portioningTips ?? []).length > 0 && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-sky-400 to-indigo-400" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-sky-400">
                  <ChefHat className="w-5 h-5" /> Portioning Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.portioningTips.map((tip, i) => (
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

          {(data.supplierTips ?? []).length > 0 && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-400" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-violet-400">
                  <DollarSign className="w-5 h-5" /> Supplier Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.supplierTips.map((tip, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-xs font-bold mt-0.5">
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
