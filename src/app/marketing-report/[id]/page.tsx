"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, Megaphone, Heart, Palette, PartyPopper, CalendarCheck,
  AlertCircle, CheckCircle2, Copy, Utensils, MapPin, Users,
} from "lucide-react";

type SocialCaption = {
  platform: string;
  caption: string;
  contentIdea: string;
};

type LogoConcept = {
  style: string;
  typography: string;
  colors: string;
  imagery: string;
  mockupDescription: string;
};

type GrandOpening = {
  eventName: string;
  dateIdea: string;
  promotionDetails: string;
  specialOffers: string[];
  marketingChannels: string[];
};

type WeekPlan = {
  week: string;
  tasks: string[];
};

type MarketingData = {
  socialCaptions: SocialCaption[];
  logoConcept: LogoConcept;
  grandOpening: GrandOpening;
  marketingChecklist: WeekPlan[];
  meta: {
    name: string;
    concept: string;
    targetCustomers: string;
    location: string | null;
    cuisine: string | null;
  };
};

function loadMarketingReport(id: string): { data: MarketingData | null; error: string } {
  try {
    const saved = localStorage.getItem(`marketing_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as MarketingData, error: "" };
    return { data: null, error: "Marketing report not found. Please start a new analysis." };
  } catch {
    return { data: null, error: "Failed to load marketing report data." };
  }
}

function CaptionCard({ item }: { item: SocialCaption }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isTikTok = item.platform.toLowerCase().includes("tiktok");
  const gradient = isTikTok
    ? "from-slate-800 to-slate-900 border-slate-700"
    : "from-rose-500/5 to-pink-500/5 border-rose-500/20";
  const accent = isTikTok ? "text-white" : "text-rose-400";

  return (
    <div className={`rounded-xl bg-gradient-to-br ${gradient} border p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>
          {item.platform}
        </span>
        <button
          type="button"
          onClick={() => copyToClipboard(item.caption)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
        >
          {copied ? (
            <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied</>
          ) : (
            <><Copy className="w-3 h-3" /> Copy</>
          )}
        </button>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{item.caption}</p>
      <div className="pt-2 border-t border-slate-800/50">
        <p className="text-xs text-slate-500">
          <span className="text-slate-400">Content idea:</span> {item.contentIdea}
        </p>
      </div>
    </div>
  );
}

function LogoSection({ logo }: { logo: LogoConcept }) {
  const sections = [
    { label: "Style", value: logo.style, icon: Palette },
    { label: "Typography", value: logo.typography, icon: Palette },
    { label: "Color Palette", value: logo.colors, icon: Palette },
    { label: "Imagery", value: logo.imagery, icon: Palette },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-sm text-slate-300 leading-relaxed">{s.value}</p>
          </div>
        ))}
      </div>
      {logo.mockupDescription && (
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Mockup Vision</p>
          <p className="text-sm text-slate-300 leading-relaxed">{logo.mockupDescription}</p>
        </div>
      )}
    </div>
  );
}

function GrandOpeningSection({ opening }: { opening: GrandOpening }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Event Name</p>
          <p className="text-lg font-bold text-white">{opening.eventName}</p>
        </div>
        <div className="flex-1 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
          <p className="text-xs text-orange-400 uppercase tracking-wider mb-1">Recommended Timing</p>
          <p className="text-sm text-slate-300">{opening.dateIdea}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Promotion Details</p>
        <p className="text-sm text-slate-300 leading-relaxed">{opening.promotionDetails}</p>
      </div>

      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Special Offers</p>
        <ul className="space-y-2">
          {opening.specialOffers.map((offer, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              {offer}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Marketing Channels</p>
        <div className="space-y-2">
          {opening.marketingChannels.map((ch, i) => (
            <p key={i} className="text-sm text-slate-300 leading-relaxed">{ch}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

const WEEK_COLORS = [
  "from-indigo-500/10 to-blue-500/10 border-indigo-500/20",
  "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
  "from-amber-500/10 to-orange-500/10 border-amber-500/20",
  "from-rose-500/10 to-pink-500/10 border-rose-500/20",
];

export default function MarketingReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: MarketingData | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadMarketingReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/marketing")}>
          Start New Marketing Plan
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your marketing plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/marketing")} className="text-slate-400 hover:text-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">Marketing Plan</h1>
        </div>
        <span className="hidden sm:block text-xs text-slate-500">
          {data.meta.name}
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shrink-0">
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{data.meta.name} Marketing Plan</h2>
            <p className="text-sm text-slate-400">
              {data.meta.concept.substring(0, 100)}{data.meta.concept.length > 100 ? "..." : ""}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {data.meta.cuisine && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-400">
                <Utensils className="w-3 h-3" /> {data.meta.cuisine}
              </span>
            )}
            {data.meta.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-400">
                <MapPin className="w-3 h-3" /> {data.meta.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-400">
              <Users className="w-3 h-3" /> {data.meta.targetCustomers.substring(0, 30)}...
            </span>
          </div>
        </div>

        {/* Social Media Captions */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-rose-400 to-pink-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Heart className="text-rose-400 w-5 h-5" /> Social Media Captions
            </CardTitle>
            <CardDescription>{data.socialCaptions.length} ready-to-post captions for Instagram & TikTok.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.socialCaptions.map((item, i) => (
                <CaptionCard key={i} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logo Concept */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Palette className="text-violet-400 w-5 h-5" /> Logo Concept
            </CardTitle>
            <CardDescription>A complete brand identity concept for your designer to execute.</CardDescription>
          </CardHeader>
          <CardContent>
            <LogoSection logo={data.logoConcept} />
          </CardContent>
        </Card>

        {/* Grand Opening */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <PartyPopper className="text-amber-400 w-5 h-5" /> Grand Opening Plan
            </CardTitle>
            <CardDescription>Event concept, timing, special offers, and channel strategy.</CardDescription>
          </CardHeader>
          <CardContent>
            <GrandOpeningSection opening={data.grandOpening} />
          </CardContent>
        </Card>

        {/* 30-Day Marketing Checklist */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarCheck className="text-emerald-400 w-5 h-5" /> 30-Day Marketing Checklist
            </CardTitle>
            <CardDescription>A week-by-week action plan for your first month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.marketingChecklist.map((week, wIdx) => (
                <div key={wIdx} className={`p-4 rounded-xl bg-gradient-to-br ${WEEK_COLORS[wIdx % WEEK_COLORS.length]} border`}>
                  <p className="text-sm font-bold text-white mb-3">{week.week}</p>
                  <ul className="space-y-2">
                    {week.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
