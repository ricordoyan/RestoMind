"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, LayoutDashboard, Palette, Lightbulb, Image as ImageIcon, Sparkles, Ruler, AlertCircle, CheckCircle2, Paintbrush } from "lucide-react";

type DesignData = {
  layout: string;
  moodBoard: string[];
  budgetTips: string[];
  referenceDescriptions: string[];
  meta: {
    squareFootage: number;
    style: string;
    photoAnalyzed: boolean;
  };
};

function loadDesignReport(id: string): { data: DesignData | null; error: string } {
  try {
    const saved = localStorage.getItem(`design_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as DesignData, error: "" };
    return { data: null, error: "Design report not found. Please start a new design analysis." };
  } catch {
    return { data: null, error: "Failed to load design report data." };
  }
}

export default function DesignReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: DesignData | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadDesignReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/design")}>
          Start New Design
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your design plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/design")} className="text-slate-400 hover:text-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">Design Plan</h1>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <Ruler className="w-3 h-3" /> {data.meta.squareFootage} sq ft &middot; {data.meta.style}
          {data.meta.photoAnalyzed && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-1" />}
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{data.meta.style} Design Plan</h2>
            <p className="text-sm text-slate-400">
              AI-generated interior design for a {data.meta.squareFootage.toLocaleString()} sq ft restaurant space
              {data.meta.photoAnalyzed && " &bull; Based on your uploaded photo"}
            </p>
          </div>
        </div>

        {/* Layout */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <LayoutDashboard className="text-violet-400 w-5 h-5" /> Suggested Layout
            </CardTitle>
            <CardDescription>Optimal space plan based on your dimensions and style.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 rounded-xl p-4 sm:p-6 border border-slate-800">
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{data.layout}</p>
            </div>
          </CardContent>
        </Card>

        {/* Mood Board */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-rose-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Palette className="text-amber-400 w-5 h-5" /> Mood Board Concept
            </CardTitle>
            <CardDescription>Colors, materials, and lighting to define the atmosphere.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.moodBoard.map((item, i) => {
                const icons = [Palette, Paintbrush, Lightbulb];
                const gradients = [
                  "from-indigo-500/10 to-purple-500/10 border-indigo-500/20",
                  "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
                  "from-amber-500/10 to-orange-500/10 border-amber-500/20",
                ];
                const Icon = icons[i] || Palette;
                return (
                  <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${gradients[i]} border`}>
                    <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budget Tips */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Lightbulb className="text-emerald-400 w-5 h-5" /> Budget-Friendly Tips
            </CardTitle>
            <CardDescription>Cost-effective ideas to achieve the look without overspending.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {data.budgetTips.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-0.5">{tip}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Reference Images */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-sky-400 to-indigo-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ImageIcon className="text-sky-400 w-5 h-5" /> Reference Inspiration
            </CardTitle>
            <CardDescription>Real-world design references that match your chosen style.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.referenceDescriptions.map((ref, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-3 border border-slate-700/50">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{ref}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
