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
  MapPin,
  Layers,
  AlertCircle,
  Star,
  TrendingUp,
  ShieldAlert,
  Users,
  Clock,
  Store,
  ChevronRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Ring = {
  label: string;
  radiusKm: number;
  count: number;
  avgRating: number | null;
  avgPriceLevel: number | null;
};

type CompetitorRow = {
  name: string;
  type: string;
  rating: number | null;
  priceLevel: number | null;
  userRatingsTotal: number | null;
  distanceKm: number;
  address: string;
};

type DominantCuisine = {
  type: string;
  count: number;
};

type TradeAreaReport = {
  tradeAreaSummary: string;
  estimatedTradeAreaRadiusKm: number;
  driveTime: { fiveMin: string; tenMin: string; fifteenMin: string };
  customerProfile: {
    segments: Array<{ name: string; description: string; sharePercent: number }>;
    notes: string;
  };
  saturation: { level: "low" | "moderate" | "high"; score: number; rationale: string };
  opportunities: string[];
  threats: string[];
  recommendation: string;
  rings: Ring[];
  dominantCuisines: DominantCuisine[];
  competitors: CompetitorRow[];
  meta: { address: string; cuisine: string; coordinates: { lat: number; lng: number } };
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-slate-600">N/A</span>;
  return (
    <span className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}

function priceLevelLabel(level: number | null): string {
  if (level == null) return "N/A";
  const labels = ["$", "$$", "$$$", "$$$$"];
  return labels[Math.round(level)] ?? "N/A";
}

function loadReport(id: string): { data: TradeAreaReport | null; error: string } {
  try {
    const saved = localStorage.getItem(`trade_area_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as TradeAreaReport, error: "" };
    return { data: null, error: "Trade area report not found. Please run a new analysis." };
  } catch {
    return { data: null, error: "Failed to load trade area report data." };
  }
}

const SATURATION_CONFIG = {
  low: {
    label: "Low Saturation",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    bar: "bg-emerald-500",
  },
  moderate: {
    label: "Moderate Saturation",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    bar: "bg-amber-500",
  },
  high: {
    label: "High Saturation",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    bar: "bg-rose-500",
  },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TradeAreaReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: TradeAreaReport | null; error: string }>(() => {
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
        <Button className="mt-4" onClick={() => router.push("/trade-area")}>
          Start New Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your trade area report...</p>
        </div>
      </div>
    );
  }

  const satCfg = SATURATION_CONFIG[data.saturation?.level ?? "moderate"];
  const maxCuisineCount = Math.max(...(data.dominantCuisines ?? []).map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/trade-area")}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">Trade Area Report</h1>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-xs">{data.meta?.address}</span>
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Page hero */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center shrink-0">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{data.meta?.cuisine} — Trade Area Analysis</h2>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {data.meta?.address}
            </p>
          </div>
        </div>

        {/* Summary + Saturation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Summary card */}
          <Card className="bg-slate-900 border-slate-800 md:col-span-2 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-sky-500" />
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${satCfg.bg} ${satCfg.text} ${satCfg.border}`}
                >
                  {satCfg.label}
                </span>
                <span className={`text-xs font-bold ${satCfg.text}`}>
                  {data.saturation?.score ?? "—"}/10
                </span>
              </div>
              <CardTitle className="text-lg sm:text-xl">Trade Area Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {data.tradeAreaSummary}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="bg-slate-950 rounded-xl px-4 py-3 border border-slate-800 flex flex-col">
                  <span className="text-xs text-slate-500">Est. Catchment Radius</span>
                  <span className="text-lg font-bold text-cyan-400 mt-0.5">
                    {data.estimatedTradeAreaRadiusKm ?? "—"} km
                  </span>
                </div>
                <div className="bg-slate-950 rounded-xl px-4 py-3 border border-slate-800 flex flex-col">
                  <span className="text-xs text-slate-500">Total Competitors Found</span>
                  <span className="text-lg font-bold text-white mt-0.5">
                    {data.competitors?.length ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saturation score ring */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col items-center justify-center py-6 relative overflow-hidden">
            <div className={`absolute inset-0 opacity-5 ${satCfg.bar}`} />
            <CardContent className="flex flex-col items-center p-0 z-10">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="currentColor" strokeWidth="10"
                    className="text-slate-800"
                  />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="currentColor" strokeWidth="10"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * (data.saturation?.score ?? 0)) / 10}
                    className={`${satCfg.text} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl sm:text-5xl font-black ${satCfg.text}`}>
                    {data.saturation?.score ?? "—"}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Saturation</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-white">{satCfg.label}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[160px] text-center line-clamp-3">
                {data.saturation?.rationale}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Concentric Rings */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-sky-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Layers className="text-cyan-400 w-5 h-5" /> Concentric Ring Analysis
            </CardTitle>
            <CardDescription>Competitor distribution across 3 rings around your site.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(data.rings ?? []).map((ring, i) => {
                const ringColors = [
                  { border: "border-cyan-500/40", bg: "bg-cyan-500/5", text: "text-cyan-400", bar: "bg-cyan-500" },
                  { border: "border-sky-500/40", bg: "bg-sky-500/5", text: "text-sky-400", bar: "bg-sky-500" },
                  { border: "border-indigo-500/40", bg: "bg-indigo-500/5", text: "text-indigo-400", bar: "bg-indigo-500" },
                ];
                const rc = ringColors[i] ?? ringColors[2];
                return (
                  <div
                    key={ring.label}
                    className={`rounded-xl border ${rc.border} ${rc.bg} p-4 space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${rc.text}`}>
                        Ring {i + 1}
                      </span>
                      <span className="text-xs text-slate-500">{ring.label}</span>
                    </div>
                    <div className="text-3xl font-black text-white">{ring.count}</div>
                    <p className="text-xs text-slate-500">competitors</p>
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Avg Rating
                        </span>
                        <span className="text-slate-300 font-medium">
                          {ring.avgRating != null ? ring.avgRating.toFixed(1) : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Avg Price</span>
                        <span className="text-slate-300 font-medium">
                          {ring.avgPriceLevel != null ? priceLevelLabel(ring.avgPriceLevel) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Drive Time */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-sky-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="text-sky-400 w-5 h-5" /> Estimated Drive Times
            </CardTitle>
            <CardDescription>Approximate reach by car — estimates only, varies by traffic.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "5 min", value: data.driveTime?.fiveMin },
                { label: "10 min", value: data.driveTime?.tenMin },
                { label: "15 min", value: data.driveTime?.fifteenMin },
              ].map((dt) => (
                <div
                  key={dt.label}
                  className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-1"
                >
                  <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider">{dt.label}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{dt.value ?? "—"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Profile */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="text-violet-400 w-5 h-5" /> Customer Profile
              <span className="text-xs font-normal text-slate-500 ml-1">(estimates)</span>
            </CardTitle>
            <CardDescription>Segments derived from competitor mix — not census data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data.customerProfile?.segments ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">Insufficient data to profile customer segments.</p>
            ) : (
              <ul className="space-y-4">
                {data.customerProfile.segments.map((seg, i) => (
                  <li key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{seg.name}</span>
                      <span className="text-xs text-slate-400 font-medium">{seg.sharePercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(seg.sharePercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{seg.description}</p>
                  </li>
                ))}
              </ul>
            )}
            {data.customerProfile?.notes && (
              <p className="text-xs text-slate-500 italic border-t border-slate-800 pt-3">
                {data.customerProfile.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dominant Cuisines */}
        {(data.dominantCuisines ?? []).length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Store className="text-amber-400 w-5 h-5" /> Dominant Cuisine Types Nearby
              </CardTitle>
              <CardDescription>Most common restaurant categories within 1.5 km.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.dominantCuisines.map((dc) => (
                  <li key={dc.type} className="flex items-center gap-3">
                    <span className="text-sm text-slate-300 w-40 shrink-0 capitalize truncate">
                      {dc.type.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700"
                        style={{ width: `${(dc.count / maxCuisineCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right shrink-0">{dc.count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Opportunities + Threats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-emerald-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
                <TrendingUp className="w-5 h-5" /> Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.opportunities ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No opportunities identified.</p>
              ) : (
                <ul className="space-y-3">
                  {data.opportunities.map((opp, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{opp}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-rose-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-rose-400">
                <ShieldAlert className="w-5 h-5" /> Threats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.threats ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No threats identified.</p>
              ) : (
                <ul className="space-y-3">
                  {data.threats.map((threat, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{threat}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Competitor Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Store className="text-teal-400 w-5 h-5" /> Competitor Landscape
            </CardTitle>
            <CardDescription>
              {(data.competitors ?? []).length > 0
                ? `${data.competitors.length} nearby restaurants within 1.5 km of your target location`
                : "No competitors found within 1.5 km radius"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(data.competitors ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">
                No competitors were found within 1.5 km. This may indicate low restaurant density — either an untapped opportunity or low foot traffic area.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[640px] text-sm">
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
                      <tr
                        key={i}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-white font-medium">{comp.name}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {comp.type?.replace(/_/g, " ") || "Restaurant"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StarRating rating={comp.rating} />
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {priceLevelLabel(comp.priceLevel)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400">
                          {comp.userRatingsTotal?.toLocaleString() ?? "N/A"}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {comp.distanceKm.toFixed(2)} km
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-sky-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ChevronRight className="text-cyan-400 w-5 h-5" /> Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 rounded-xl p-4 sm:p-6 border border-slate-800">
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {data.recommendation ?? "No recommendation available."}
              </p>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
