"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, MapPin, TrendingUp, ShieldAlert, Store, DollarSign, AlertTriangle, CheckCircle2, XCircle, Star, Receipt, AlertCircle } from "lucide-react";

type CompetitorData = {
  name: string;
  type: string;
  rating: number | null;
  priceLevel: number | null;
  userRatingsTotal: number | null;
  distanceKm: number;
  address: string;
};

type RiskData = {
  risk: string;
  severity: "high" | "medium" | "low";
};

type ReportData = {
  score: number;
  scoreRationale: string;
  summary: string;
  locationDetails: {
    formattedAddress: string;
    coordinates: { lat: number; lng: number };
  };
  competitors: CompetitorData[];
  footTraffic: {
    estimatedDaily: string;
    notes: string;
  };
  revenue: {
    monthlyEstimate: string;
    pricingSweetSpot: string;
  };
  risks: RiskData[];
  negotiationAdvice: string;
  menuPricing: string;
  verdict: "good_deal" | "proceed_with_caution" | "avoid";
};

const VERDICT_CONFIG = {
  good_deal: {
    label: "Good Deal",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  proceed_with_caution: {
    label: "Proceed with Caution",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  avoid: {
    label: "Avoid",
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
};

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-600">N/A</span>;
  return (
    <span className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}

const priceLevelLabel = (level: number | null) => {
  if (level == null) return "N/A";
  const labels = ["$", "$$", "$$$", "$$$$"];
  return labels[level] || "N/A";
};

function loadReport(id: string): { data: ReportData | null; error: string } {
  try {
    const saved = localStorage.getItem(`report_${id}`);
    if (saved) return { data: JSON.parse(saved) as ReportData, error: "" };
    return { data: null, error: "Report not found. Please run a new analysis." };
  } catch {
    return { data: null, error: "Failed to load report data." };
  }
}

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: ReportData | null; error: string }>(() => {
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
        <Button className="mt-4" onClick={() => router.push("/analyze")}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your AI report...</p>
        </div>
      </div>
    );
  }

  const verdictCfg = VERDICT_CONFIG[data.verdict] || VERDICT_CONFIG.proceed_with_caution;
  const VerdictIcon = verdictCfg.icon;
  const scoreColor = data.score >= 8 ? "text-emerald-400" : data.score >= 5 ? "text-amber-400" : "text-rose-400";
  const scoreRingColor = data.score >= 8 ? "stroke-emerald-500" : data.score >= 5 ? "stroke-amber-500" : "stroke-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/analyze")} className="text-slate-400 hover:text-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">Analysis Report</h1>
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">#{id?.toString().slice(-6)}</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Score + Verdict */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800 md:col-span-1 flex flex-col items-center justify-center py-6 sm:py-8 relative overflow-hidden">
            <CardContent className="flex flex-col items-center p-0 z-10">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
                  <circle
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10"
                    strokeDasharray="283" strokeDashoffset={283 - (283 * data.score) / 10}
                    className={`${scoreRingColor} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl sm:text-5xl font-black ${scoreColor}`}>{data.score}</span>
                  <span className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-widest">Out of 10</span>
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Attractiveness Score</h2>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${verdictCfg.bg} ${verdictCfg.color} ${verdictCfg.border} border`}>
                  <VerdictIcon className="w-3.5 h-3.5" />
                  {verdictCfg.label}
                </span>
              </div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{data.summary}</p>
              <p className="text-xs sm:text-sm text-slate-400 italic">{data.scoreRationale}</p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                <div className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Est. Revenue
                  </p>
                  <p className="text-base sm:text-xl font-semibold text-white">{data.revenue.monthlyEstimate}</p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Daily Foot Traffic
                  </p>
                  <p className="text-base sm:text-xl font-semibold text-white">{data.footTraffic.estimatedDaily}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Competitor Landscape */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Store className="text-teal-400 w-5 h-5" /> Competitor Landscape
            </CardTitle>
            <CardDescription>
              {data.competitors.length > 0
                ? `${data.competitors.length} nearby restaurants within 1 km of your target location`
                : "No competitors found within 1 km radius"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.competitors.length === 0 ? (
              <p className="text-slate-400 text-sm">No competitors were found within 1 km of the target location. This could indicate low restaurant density&mdash;either an untapped opportunity or low foot traffic area.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Type</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Rating</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Price</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Reviews</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.competitors.map((comp, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{comp.name}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{comp.type?.replace(/_/g, " ") || "Restaurant"}</td>
                        <td className="py-3 px-4 text-center"><StarRating rating={comp.rating} /></td>
                        <td className="py-3 px-4 text-center text-slate-300">{priceLevelLabel(comp.priceLevel)}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{comp.userRatingsTotal?.toLocaleString() || "N/A"}</td>
                        <td className="py-3 px-4 text-center text-slate-300">{comp.distanceKm.toFixed(2)} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Data Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="text-indigo-400 w-5 h-5" /> Foot Traffic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Estimated Daily Foot Traffic</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{data.footTraffic.estimatedDaily}</p>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{data.footTraffic.notes}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="text-emerald-400 w-5 h-5" /> Revenue & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Monthly Revenue Estimate</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">{data.revenue.monthlyEstimate}</p>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Menu Pricing Sweet Spot</p>
                <p className="text-base sm:text-lg font-semibold text-indigo-400">{data.revenue.pricingSweetSpot}</p>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">{data.menuPricing}</p>
            </CardContent>
          </Card>
        </div>

        {/* Risks + Negotiation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-rose-400">
                <ShieldAlert className="w-5 h-5" /> Top Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.risks.length === 0 ? (
                <p className="text-slate-400 text-sm">No significant risks identified.</p>
              ) : (
                <ul className="space-y-4">
                  {data.risks.map((r, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-sm font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{r.risk}</p>
                        <span
                          className={`inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                            r.severity === "high"
                              ? "text-rose-400 bg-rose-500/10"
                              : r.severity === "medium"
                                ? "text-amber-400 bg-amber-500/10"
                                : "text-slate-400 bg-slate-800"
                          }`}
                        >
                          {r.severity}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-indigo-400">
                <Receipt className="w-5 h-5" /> Negotiation Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed">{data.negotiationAdvice || "No specific negotiation advice available."}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
