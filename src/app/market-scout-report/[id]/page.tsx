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
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Star,
  AlertCircle,
  Telescope,
  MapPin,
  Trophy,
  Lightbulb,
  Store,
} from "lucide-react";

type AreaResult = {
  name: string;
  opportunityScore: number;
  competitorCount: number;
  sameCuisineCount: number;
  avgCompetitorRating: number | null;
  saturation: "low" | "moderate" | "high";
  verdict: "prime" | "promising" | "saturated";
  rationale: string;
};

type MarketScoutData = {
  marketSummary: string;
  areas: AreaResult[];
  topPick: string;
  recommendation: string;
  meta: {
    city: string;
    cuisine: string;
    areaCount: number;
  };
};

function loadMarketScoutReport(id: string): {
  data: MarketScoutData | null;
  error: string;
} {
  try {
    const saved = localStorage.getItem(`market_scout_report_${id}`);
    if (saved)
      return { data: JSON.parse(saved) as MarketScoutData, error: "" };
    return {
      data: null,
      error: "Report not found. Please run a new Market Scout analysis.",
    };
  } catch {
    return { data: null, error: "Failed to load Market Scout report data." };
  }
}

const VERDICT_CONFIG = {
  prime: {
    label: "Prime",
    textColor: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  promising: {
    label: "Promising",
    textColor: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  saturated: {
    label: "Saturated",
    textColor: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
};

const SATURATION_CONFIG = {
  low: { label: "Low Saturation", textColor: "text-emerald-400" },
  moderate: { label: "Moderate Saturation", textColor: "text-amber-400" },
  high: { label: "High Saturation", textColor: "text-rose-400" },
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-400"
      : score >= 45
        ? "text-amber-400"
        : "text-rose-400";
  const barColor =
    score >= 70
      ? "bg-emerald-500"
      : score >= 45
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="flex flex-col items-end gap-1 min-w-[80px]">
      <span className={`text-3xl font-black tabular-nums ${color}`}>
        {score}
      </span>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">
        / 100
      </span>
    </div>
  );
}

export default function MarketScoutReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{
    data: MarketScoutData | null;
    error: string;
  }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadMarketScoutReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/market-scout")}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your Market Scout report...</p>
        </div>
      </div>
    );
  }

  const areas = data.areas ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/market-scout")}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">
            Market Scout Report
          </h1>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3 h-3" /> {data.meta.city} &middot;{" "}
          {data.meta.cuisine}
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center shrink-0">
            <Telescope className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {data.meta.cuisine} Opportunity Map
            </h2>
            <p className="text-sm text-slate-400">
              White-space analysis across {data.meta.areaCount} neighborhoods in{" "}
              {data.meta.city}
            </p>
          </div>
        </div>

        {/* Market summary + top pick */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800 md:col-span-2 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-lime-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Store className="text-emerald-400 w-5 h-5" /> Market Overview
              </CardTitle>
              <CardDescription>
                Based on real competitor data across {data.meta.areaCount}{" "}
                districts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {data.marketSummary}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-lime-400" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Trophy className="text-amber-400 w-5 h-5" /> Top Pick
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-emerald-500/10 to-lime-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-lg sm:text-xl font-bold text-emerald-400">
                  {data.topPick || "—"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Highest white-space opportunity
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ranked area cards */}
        {areas.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-8 text-center">
              <p className="text-slate-400">
                No neighborhood data was returned. Please try a different city
                or cuisine.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Neighborhood
              Rankings
            </h3>
            {areas.map((area, index) => {
              const verdictCfg =
                VERDICT_CONFIG[area.verdict] ?? VERDICT_CONFIG.promising;
              const satCfg =
                SATURATION_CONFIG[area.saturation] ??
                SATURATION_CONFIG.moderate;

              return (
                <Card
                  key={area.name}
                  className="bg-slate-900 border-slate-800 overflow-hidden"
                >
                  <div
                    className={`h-1 ${
                      index === 0
                        ? "bg-gradient-to-r from-emerald-500 to-lime-500"
                        : "bg-slate-800"
                    }`}
                  />
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-4">
                      {/* Rank badge */}
                      <div className="shrink-0 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                        {index + 1}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Name + verdict + score row */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-base sm:text-lg font-bold text-white">
                              {area.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${verdictCfg.bg} ${verdictCfg.textColor} ${verdictCfg.border} border`}
                              >
                                {verdictCfg.label}
                              </span>
                              <span
                                className={`text-xs font-medium ${satCfg.textColor}`}
                              >
                                {satCfg.label}
                              </span>
                            </div>
                          </div>
                          <ScoreBadge score={area.opportunityScore} />
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="bg-slate-950 rounded-lg px-3 py-2 border border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                              Total Restaurants
                            </p>
                            <p className="text-sm font-semibold text-white">
                              {area.competitorCount}
                            </p>
                          </div>
                          <div className="bg-slate-950 rounded-lg px-3 py-2 border border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                              Same Cuisine
                            </p>
                            <p className="text-sm font-semibold text-white">
                              {area.sameCuisineCount}
                            </p>
                          </div>
                          <div className="bg-slate-950 rounded-lg px-3 py-2 border border-slate-800 col-span-2 sm:col-span-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                              Avg. Rating
                            </p>
                            <p className="text-sm font-semibold text-white flex items-center gap-1">
                              {area.avgCompetitorRating !== null ? (
                                <>
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  {area.avgCompetitorRating.toFixed(1)}
                                </>
                              ) : (
                                <span className="text-slate-500">N/A</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              Opportunity Score
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {area.opportunityScore} / 100
                            </span>
                          </div>
                          <Progress
                            value={area.opportunityScore}
                            className="h-2 bg-slate-800"
                          />
                        </div>

                        {/* Rationale */}
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                          {area.rationale}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Recommendation card */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-lime-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Lightbulb className="text-lime-400 w-5 h-5" /> Strategic
              Recommendation
            </CardTitle>
            <CardDescription>
              Actionable guidance for opening a {data.meta.cuisine} restaurant
              in {data.meta.city}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-emerald-500/5 to-lime-500/5 border border-emerald-500/15 rounded-xl p-4 sm:p-6">
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {data.recommendation}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
