"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, Utensils, Star, AlertTriangle, TrendingUp, LayoutGrid,
  AlertCircle, CheckCircle2, XCircle, ArrowUp, DollarSign,
} from "lucide-react";

type DishAnalysis = {
  name: string;
  currentMargin: number;
  suggestedPrice: number;
  suggestedMargin: number;
  priceAdjustment: string;
  verdict: "star" | "keep" | "adjust" | "cut";
  reason: string;
};

type StarDish = {
  name: string;
  reason: string;
  marketingTip: string;
};

type UnprofitableDish = {
  name: string;
  currentMargin: number;
  reason: string;
  solution: string;
};

type CategoryBreakdown = {
  category: string;
  items: string[];
  averageMargin: number;
  recommendation: string;
};

type MenuEngineerData = {
  menuHealth: {
    overallScore: number;
    averageMargin: number;
    totalPotentialProfit: string;
    summary: string;
  };
  dishAnalysis: DishAnalysis[];
  stars: StarDish[];
  unprofitable: UnprofitableDish[];
  layoutImprovements: string[];
  categoryBreakdown: CategoryBreakdown[];
  meta: {
    restaurantName: string | null;
    cuisine: string | null;
    dishCount: number;
    averageMargin: number;
  };
};

const VERDICT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  star: { label: "Star", icon: Star, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  keep: { label: "Keep", icon: CheckCircle2, color: "text-slate-300", bg: "bg-slate-800" },
  adjust: { label: "Adjust", icon: ArrowUp, color: "text-amber-400", bg: "bg-amber-500/10" },
  cut: { label: "Cut", icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10" },
};

function loadMenuReport(id: string): { data: MenuEngineerData | null; error: string } {
  try {
    const saved = localStorage.getItem(`menu_engineer_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as MenuEngineerData, error: "" };
    return { data: null, error: "Menu report not found. Please run a new analysis." };
  } catch {
    return { data: null, error: "Failed to load menu report data." };
  }
}

function MarginBadge({ margin }: { margin: number }) {
  const color = margin >= 70 ? "text-emerald-400 bg-emerald-500/10" : margin >= 55 ? "text-amber-400 bg-amber-500/10" : "text-rose-400 bg-rose-500/10";
  return <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${color}`}>{margin}%</span>;
}

export default function MenuEngineerReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: MenuEngineerData | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadMenuReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/menu-engineer")}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your menu analysis...</p>
        </div>
      </div>
    );
  }

  const scoreColor = data.menuHealth.overallScore >= 7 ? "text-emerald-400" : data.menuHealth.overallScore >= 5 ? "text-amber-400" : "text-rose-400";
  const scoreRing = data.menuHealth.overallScore >= 7 ? "stroke-emerald-500" : data.menuHealth.overallScore >= 5 ? "stroke-amber-500" : "stroke-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/menu-engineer")} className="text-slate-400 hover:text-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">Menu Analysis</h1>
        </div>
        <span className="hidden sm:block text-xs text-slate-500">
          {data.meta.dishCount} dishes &middot; {data.meta.averageMargin}% avg margin
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
            <Utensils className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {data.meta.restaurantName ? `${data.meta.restaurantName} Menu Analysis` : "Menu Analysis"}
            </h2>
            <p className="text-sm text-slate-400">{data.menuHealth.summary}</p>
          </div>
        </div>

        {/* Score + Health Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800 flex flex-col items-center justify-center py-6 relative overflow-hidden">
            <CardContent className="flex flex-col items-center p-0 z-10">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * data.menuHealth.overallScore) / 10} className={`${scoreRing} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-3xl sm:text-4xl font-black ${scoreColor}`}>{data.menuHealth.overallScore}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">out of 10</span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-white">Menu Health Score</h3>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 md:col-span-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Average Margin
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${data.menuHealth.averageMargin >= 65 ? "text-emerald-400" : data.menuHealth.averageMargin >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                    {data.menuHealth.averageMargin}%
                  </p>
                </div>
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Potential Profit
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-white">{data.menuHealth.totalPotentialProfit}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-500/10 rounded-lg p-3">
                  <p className="text-2xl font-bold text-emerald-400">{data.stars.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Stars</p>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3">
                  <p className="text-2xl font-bold text-amber-400">{data.dishAnalysis.filter((d) => d.verdict === "adjust").length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Adjust</p>
                </div>
                <div className="bg-rose-500/10 rounded-lg p-3">
                  <p className="text-2xl font-bold text-rose-400">{data.unprofitable.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Cut/Rework</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dish Analysis Table */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Utensils className="text-orange-400 w-5 h-5" /> Dish-by-Dish Analysis
            </CardTitle>
            <CardDescription>Every dish scored with price adjustments and verdicts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-3 text-slate-500 font-medium">Dish</th>
                    <th className="text-center py-3 px-3 text-slate-500 font-medium">Margin</th>
                    <th className="text-center py-3 px-3 text-slate-500 font-medium">Suggested Price</th>
                    <th className="text-center py-3 px-3 text-slate-500 font-medium">New Margin</th>
                    <th className="text-center py-3 px-3 text-slate-500 font-medium">Adjustment</th>
                    <th className="text-center py-3 px-3 text-slate-500 font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dishAnalysis.map((dish, i) => {
                    const cfg = VERDICT_CONFIG[dish.verdict] || VERDICT_CONFIG.keep;
                    const VIcon = cfg.icon;
                    return (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-medium text-white">{dish.name}</td>
                        <td className="py-3 px-3 text-center"><MarginBadge margin={dish.currentMargin} /></td>
                        <td className="py-3 px-3 text-center text-slate-300">${dish.suggestedPrice.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center"><MarginBadge margin={dish.suggestedMargin} /></td>
                        <td className="py-3 px-3 text-center text-xs text-slate-400">{dish.priceAdjustment}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
                            <VIcon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stars + Unprofitable Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
                <Star className="w-5 h-5" /> Star Dishes
              </CardTitle>
              <CardDescription>Feature these prominently on your menu.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.stars.length === 0 ? (
                <p className="text-slate-400 text-sm">No star dishes identified.</p>
              ) : (
                <div className="space-y-4">
                  {data.stars.map((star, i) => (
                    <div key={i} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="font-semibold text-white text-sm">{star.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{star.reason}</p>
                      <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {star.marketingTip}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-400 to-orange-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-rose-400">
                <AlertTriangle className="w-5 h-5" /> Unprofitable Items
              </CardTitle>
              <CardDescription>Consider reworking or removing these dishes.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.unprofitable.length === 0 ? (
                <p className="text-slate-400 text-sm">No unprofitable items found.</p>
              ) : (
                <div className="space-y-4">
                  {data.unprofitable.map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white text-sm">{item.name}</p>
                        <MarginBadge margin={item.currentMargin} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.reason}</p>
                      <p className="text-xs text-amber-400 mt-2">
                        <span className="font-medium">Solution:</span> {item.solution}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Layout Improvements */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <LayoutGrid className="text-violet-400 w-5 h-5" /> Menu Layout Improvements
            </CardTitle>
            <CardDescription>Psychology-backed suggestions for better menu design.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.layoutImprovements.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-sm font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{tip}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {data.categoryBreakdown.length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-sky-400 to-indigo-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <LayoutGrid className="text-sky-400 w-5 h-5" /> Category Breakdown
              </CardTitle>
              <CardDescription>Profitability by menu section.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.categoryBreakdown.map((cat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="font-semibold text-white text-sm mb-1">{cat.category}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <MarginBadge margin={cat.averageMargin} />
                      <span className="text-xs text-slate-500">{cat.items.length} items</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{cat.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
