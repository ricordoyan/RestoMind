"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  MapPin,
  GitCompare,
  TrendingDown,
  DollarSign,
  Layers,
  Lightbulb,
  Info,
} from "lucide-react";

// ---------- Types ----------

type SalesTransfer = {
  estimate: string;
  basis: string;
};

type Factor = {
  factor: string;
  impact: "increases" | "reduces";
  note: string;
};

type ImpactMeta = {
  existingAddress: string;
  newAddress: string;
  cuisine: string;
  existingMonthlyRevenue: number | null;
  nearbyCount: number;
  sameCuisineCount: number;
};

type ImpactReport = {
  overlapPercent: number;
  cannibalizationPercent: number;
  riskLevel: "low" | "moderate" | "high";
  salesTransfer: SalesTransfer;
  netNewRevenue: string;
  summary: string;
  factors: Factor[];
  recommendation: string;
  verdict: "expand" | "caution" | "too_close";
  distanceKm: number;
  meta: ImpactMeta;
};

// ---------- Config ----------

const VERDICT_CONFIG = {
  expand: {
    label: "Expand",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ringColor: "stroke-emerald-500",
    progressColor: "bg-emerald-500",
  },
  caution: {
    label: "Proceed with Caution",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    ringColor: "stroke-amber-500",
    progressColor: "bg-amber-500",
  },
  too_close: {
    label: "Too Close",
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    ringColor: "stroke-rose-500",
    progressColor: "bg-rose-500",
  },
};

const RISK_CONFIG = {
  low: { label: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  moderate: { label: "Moderate Risk", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  high: { label: "High Risk", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
};

// ---------- Helpers ----------

function loadImpactReport(id: string): { data: ImpactReport | null; error: string } {
  try {
    const saved = localStorage.getItem(`impact_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as ImpactReport, error: "" };
    return { data: null, error: "Impact report not found. Please run a new analysis." };
  } catch {
    return { data: null, error: "Failed to load impact report data." };
  }
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// SVG score ring for cannibalizationPercent (0-100)
function CannibalizationRing({
  percent,
  ringColor,
  textColor,
}: {
  percent: number;
  ringColor: string;
  textColor: string;
}) {
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * Math.min(Math.max(percent, 0), 100)) / 100;
  return (
    <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${ringColor} transition-all duration-1000 ease-out`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-4xl sm:text-5xl font-black ${textColor}`}>{Math.round(percent)}%</span>
        <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 uppercase tracking-widest">Cannib.</span>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function ImpactReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: ImpactReport | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadImpactReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => router.push("/impact")}>
          Run New Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your impact report...</p>
        </div>
      </div>
    );
  }

  const verdict = (data.verdict ?? "caution") as keyof typeof VERDICT_CONFIG;
  const riskLevel = (data.riskLevel ?? "moderate") as keyof typeof RISK_CONFIG;
  const verdictCfg = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.caution;
  const riskCfg = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.moderate;
  const VerdictIcon = verdictCfg.icon;

  const cannibalizationPct = safeNum(data.cannibalizationPercent);
  const overlapPct = safeNum(data.overlapPercent);
  const distanceKm = safeNum(data.distanceKm);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/impact")}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-amber-400 shrink-0" />
            Impact Analysis Report
          </h1>
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">#{id?.toString().slice(-6)}</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* ── Hero Card: verdict + distance + ring + summary ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Ring card */}
          <Card className="bg-slate-900 border-slate-800 md:col-span-1 flex flex-col items-center justify-center py-6 sm:py-8 relative overflow-hidden">
            {/* amber top accent bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardContent className="flex flex-col items-center p-0 z-10 mt-2">
              <CannibalizationRing
                percent={cannibalizationPct}
                ringColor={verdictCfg.ringColor}
                textColor={verdictCfg.color}
              />
              <h2 className="text-base sm:text-lg font-bold text-white mt-4 text-center px-4">
                Cannibalization Estimate
              </h2>
              <p className="text-xs text-slate-500 text-center px-4 mt-1">
                Est. share of existing sales transferred
              </p>
            </CardContent>
          </Card>

          {/* Verdict + meta + summary card */}
          <Card className="bg-slate-900 border-slate-800 md:col-span-2 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader className="pb-3">
              {/* Verdict badge */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${verdictCfg.bg} ${verdictCfg.color} ${verdictCfg.border} border`}
                >
                  <VerdictIcon className="w-3.5 h-3.5" />
                  {verdictCfg.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${riskCfg.bg} ${riskCfg.color} ${riskCfg.border} border`}
                >
                  {riskCfg.label}
                </span>
              </div>
              <CardTitle className="text-xl sm:text-2xl">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {data.summary ?? "No summary available."}
              </p>

              {/* Distance + cuisine callout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Distance
                  </p>
                  <p className="text-xl font-bold text-white">{distanceKm.toFixed(2)} km</p>
                  <p className="text-[10px] text-slate-600">between sites</p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" /> Trade Overlap
                  </p>
                  <p className="text-xl font-bold text-white">{Math.round(overlapPct)}%</p>
                  <p className="text-[10px] text-slate-600">est. area overlap</p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-1 col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <GitCompare className="w-3 h-3 text-amber-400" /> Nearby
                  </p>
                  <p className="text-xl font-bold text-white">{data.meta?.nearbyCount ?? 0}</p>
                  <p className="text-[10px] text-slate-600">restaurants within 1.5 km of new site</p>
                </div>
              </div>

              {/* Location pills */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">Existing</span>
                  <span className="text-slate-300">{data.meta?.existingAddress ?? "—"}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">New</span>
                  <span className="text-slate-300">{data.meta?.newAddress ?? "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Overlap + Cannibalization progress bars ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Layers className="text-indigo-400 w-4 h-4" /> Trade-Area Overlap
              </CardTitle>
              <CardDescription>Estimated physical overlap of customer draw zones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-white">{Math.round(overlapPct)}%</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskCfg.bg} ${riskCfg.color} ${riskCfg.border} border`}>
                  {riskCfg.label}
                </span>
              </div>
              <Progress value={overlapPct} className="h-3 bg-slate-800" />
              <p className="text-xs text-slate-500">
                0% = fully separate trade areas · 100% = identical coverage zone
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingDown className="text-amber-400 w-4 h-4" /> Cannibalization
              </CardTitle>
              <CardDescription>Estimated share of existing store sales transferred</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-black ${verdictCfg.color}`}>{Math.round(cannibalizationPct)}%</span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${verdictCfg.bg} ${verdictCfg.color} ${verdictCfg.border} border`}
                >
                  <VerdictIcon className="w-3 h-3" />
                  {verdictCfg.label}
                </span>
              </div>
              <Progress value={cannibalizationPct} className="h-3 bg-slate-800" />
              <p className="text-xs text-slate-500">
                0% = no cannibal. · 100% = new site replaces existing store entirely
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Sales Transfer + Net-New Revenue ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <DollarSign className="text-amber-400 w-4 h-4" /> Sales Transfer
              </CardTitle>
              <CardDescription>Estimated revenue shift from existing to new location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Estimate</p>
                <p className="text-base sm:text-lg font-bold text-white">
                  {data.salesTransfer?.estimate ?? "—"}
                </p>
              </div>
              {data.salesTransfer?.basis && (
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  {data.salesTransfer.basis}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingDown className="text-emerald-400 w-4 h-4 rotate-180" /> Net-New Revenue
              </CardTitle>
              <CardDescription>Incremental revenue the new site would generate for the brand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Estimate</p>
                <p className="text-base sm:text-lg font-bold text-emerald-400">
                  {data.netNewRevenue ?? "—"}
                </p>
              </div>
              {data.meta?.existingMonthlyRevenue == null && (
                <p className="text-xs text-slate-500 mt-2 italic">
                  Provide existing monthly revenue for a dollar-range estimate.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Factors ── */}
        {Array.isArray(data.factors) && data.factors.length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Lightbulb className="text-amber-400 w-5 h-5" /> Key Factors
              </CardTitle>
              <CardDescription>
                How each factor affects cannibalization risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {data.factors.map((f, i) => {
                  const increases = f.impact === "increases";
                  return (
                    <li key={i} className="flex gap-3 items-start">
                      <div
                        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                          increases ? "bg-rose-500/10" : "bg-emerald-500/10"
                        }`}
                      >
                        {increases ? (
                          <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{f.factor ?? "—"}</p>
                          <span
                            className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                              increases
                                ? "text-rose-400 bg-rose-500/10"
                                : "text-emerald-400 bg-emerald-500/10"
                            }`}
                          >
                            {increases ? "raises cannibal." : "lowers cannibal."}
                          </span>
                        </div>
                        {f.note && (
                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-1">{f.note}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ── Recommendation ── */}
        {data.recommendation && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle2 className="text-indigo-400 w-5 h-5" /> Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 rounded-xl p-4 sm:p-6 border border-slate-800">
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{data.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Disclaimer ── */}
        <div className="flex items-start gap-2 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-400">Directional estimate only.</span>{" "}
            This analysis is based solely on inter-site distance and nearby competitor density. It does not
            incorporate mobile-location visit data, demographic surveys, or actual foot-traffic counts.
            Treat these figures as a starting point for deeper due diligence, not as a definitive forecast.
          </p>
        </div>
      </main>
    </div>
  );
}
