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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ListChecks,
  ShieldCheck,
  GraduationCap,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Utensils,
} from "lucide-react";

// ─── Contract types ───────────────────────────────────────────────────────────

type ChecklistTask = {
  task: string;
  station: string;
};

type Checklist = {
  title: string;
  frequency: "daily" | "weekly" | "monthly";
  tasks: ChecklistTask[];
};

type FoodSafetyProcedure = {
  procedure: string;
  detail: string;
};

type TrainingModule = {
  title: string;
  objectives: string[];
  durationMins: number;
};

type TrainingRole = {
  role: string;
  modules: TrainingModule[];
};

type OnboardingDay = {
  day: string;
  focus: string;
  activities: string[];
};

type PlaybookMeta = {
  restaurantName: string | null;
  cuisine: string;
  serviceStyle: string;
  teamSize: number | null;
};

type PlaybookData = {
  overview: string;
  checklists: Checklist[];
  foodSafety: FoodSafetyProcedure[];
  trainingModules: TrainingRole[];
  onboardingPlan: OnboardingDay[];
  complianceNotes: string[];
  meta: PlaybookMeta;
};

// ─── Loader ───────────────────────────────────────────────────────────────────

function loadPlaybookReport(id: string): { data: PlaybookData | null; error: string } {
  try {
    const saved = localStorage.getItem(`playbook_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as PlaybookData, error: "" };
    return { data: null, error: "Playbook report not found. Please generate a new one." };
  } catch {
    return { data: null, error: "Failed to load playbook report data." };
  }
}

// ─── Frequency badge ──────────────────────────────────────────────────────────

const FREQ_BADGE: Record<string, string> = {
  daily: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  weekly: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  monthly: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

function FrequencyBadge({ frequency }: { frequency: string }) {
  const cls = FREQ_BADGE[frequency] ?? "bg-slate-700 text-slate-400 border-slate-600";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${cls}`}
    >
      {frequency}
    </span>
  );
}

// ─── Checklist section ────────────────────────────────────────────────────────

function ChecklistsSection({ checklists }: { checklists: Checklist[] }) {
  if (!checklists.length) {
    return <p className="text-slate-500 text-sm">No checklists available.</p>;
  }
  return (
    <div className="space-y-5">
      {checklists.map((cl, idx) => (
        <div
          key={idx}
          className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">{cl.title}</h3>
            <FrequencyBadge frequency={cl.frequency} />
          </div>
          <ul className="divide-y divide-slate-800/60">
            {(cl.tasks ?? []).map((t, tIdx) => (
              <li key={tIdx} className="flex items-start gap-3 px-4 py-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0 accent-indigo-500 w-4 h-4 cursor-pointer"
                  aria-label={t.task}
                />
                <span className="flex-1 text-sm text-slate-300 leading-snug">{t.task}</span>
                <span className="shrink-0 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                  {t.station}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Food Safety section ──────────────────────────────────────────────────────

function FoodSafetySection({ procedures }: { procedures: FoodSafetyProcedure[] }) {
  if (!procedures.length) {
    return <p className="text-slate-500 text-sm">No food-safety procedures available.</p>;
  }
  return (
    <div className="space-y-3">
      {procedures.map((p, idx) => (
        <div
          key={idx}
          className="rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 p-4"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">{p.procedure}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{p.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Training section ─────────────────────────────────────────────────────────

function TrainingSection({ roles }: { roles: TrainingRole[] }) {
  if (!roles.length) {
    return <p className="text-slate-500 text-sm">No training modules available.</p>;
  }
  return (
    <div className="space-y-6">
      {roles.map((r, rIdx) => (
        <div key={rIdx}>
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3">
            {r.role}
          </h3>
          <div className="space-y-3">
            {(r.modules ?? []).map((m, mIdx) => (
              <div
                key={mIdx}
                className="rounded-xl bg-slate-950 border border-slate-800 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-white">{m.title}</p>
                  <span className="shrink-0 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-medium whitespace-nowrap">
                    {m.durationMins} min
                  </span>
                </div>
                {(m.objectives ?? []).length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {m.objectives.map((obj, oIdx) => (
                      <li key={oIdx} className="flex items-start gap-2 text-sm text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Onboarding section ───────────────────────────────────────────────────────

const DAY_COLORS = [
  "from-indigo-500/10 to-blue-500/10 border-indigo-500/20",
  "from-violet-500/10 to-purple-500/10 border-violet-500/20",
  "from-sky-500/10 to-cyan-500/10 border-sky-500/20",
  "from-teal-500/10 to-emerald-500/10 border-teal-500/20",
  "from-amber-500/10 to-orange-500/10 border-amber-500/20",
];

function OnboardingSection({ plan }: { plan: OnboardingDay[] }) {
  if (!plan.length) {
    return <p className="text-slate-500 text-sm">No onboarding plan available.</p>;
  }
  return (
    <div className="space-y-4">
      {plan.map((entry, idx) => (
        <div
          key={idx}
          className={`rounded-xl bg-gradient-to-br ${DAY_COLORS[idx % DAY_COLORS.length]} border p-4`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
              {entry.day}
            </span>
          </div>
          <p className="text-sm font-semibold text-white mb-2">{entry.focus}</p>
          <ul className="space-y-1">
            {(entry.activities ?? []).map((act, aIdx) => (
              <li key={aIdx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {aIdx + 1}
                </span>
                {act}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlaybookReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: PlaybookData | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadPlaybookReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0" onClick={() => router.push("/playbook")}>
          Generate New Playbook
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your ops playbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/playbook")}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">Ops Playbook</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          {data.meta.restaurantName && (
            <span className="flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5" />
              {data.meta.restaurantName}
            </span>
          )}
          <span className="text-slate-700">·</span>
          <span>{data.meta.cuisine}</span>
          <span className="text-slate-700">·</span>
          <span>{data.meta.serviceStyle}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Hero summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shrink-0">
            <ListChecks className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {data.meta.restaurantName
                ? `${data.meta.restaurantName} — Ops Playbook`
                : "Ops Playbook"}
            </h2>
            <p className="text-sm text-slate-400">
              {data.meta.cuisine} · {data.meta.serviceStyle}
              {data.meta.teamSize ? ` · ${data.meta.teamSize} staff` : ""}
            </p>
          </div>
        </div>

        {/* Overview card */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500" />
          <CardHeader>
            <CardTitle className="text-lg text-white">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 leading-relaxed">{data.overview}</p>
          </CardContent>
        </Card>

        {/* Tabbed sections */}
        <Tabs defaultValue="checklists" className="w-full">
          <TabsList className="mb-6 bg-slate-900 border border-slate-800 p-1 h-auto rounded-xl flex-wrap gap-1">
            <TabsTrigger
              value="checklists"
              className="flex items-center gap-1.5 text-slate-400 data-active:text-white data-active:bg-slate-800 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <ListChecks className="w-4 h-4" />
              <span>Checklists</span>
            </TabsTrigger>
            <TabsTrigger
              value="foodSafety"
              className="flex items-center gap-1.5 text-slate-400 data-active:text-white data-active:bg-slate-800 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Food Safety</span>
            </TabsTrigger>
            <TabsTrigger
              value="training"
              className="flex items-center gap-1.5 text-slate-400 data-active:text-white data-active:bg-slate-800 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Training</span>
            </TabsTrigger>
            <TabsTrigger
              value="onboarding"
              className="flex items-center gap-1.5 text-slate-400 data-active:text-white data-active:bg-slate-800 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Onboarding</span>
            </TabsTrigger>
          </TabsList>

          {/* Checklists tab */}
          <TabsContent value="checklists">
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <ListChecks className="text-indigo-400 w-5 h-5" /> Daily &amp; Recurring Checklists
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Station-specific tasks for opening, closing, and regular maintenance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChecklistsSection checklists={data.checklists ?? []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Food Safety tab */}
          <TabsContent value="foodSafety">
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <ShieldCheck className="text-emerald-400 w-5 h-5" /> Food Safety SOPs
                </CardTitle>
                <CardDescription className="text-slate-400">
                  HACCP-aligned procedures. Verify requirements with your local health authority.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FoodSafetySection procedures={data.foodSafety ?? []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training tab */}
          <TabsContent value="training">
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <GraduationCap className="text-violet-400 w-5 h-5" /> Role-Based Training Modules
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Structured learning paths for every role on your team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrainingSection roles={data.trainingModules ?? []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onboarding tab */}
          <TabsContent value="onboarding">
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <CalendarDays className="text-amber-400 w-5 h-5" /> First-Week Onboarding Plan
                </CardTitle>
                <CardDescription className="text-slate-400">
                  A day-by-day guide to getting new staff up to speed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OnboardingSection plan={data.onboardingPlan ?? []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Compliance notes */}
        {(data.complianceNotes ?? []).length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <ShieldCheck className="text-rose-400 w-5 h-5" /> Compliance Notes
              </CardTitle>
              <CardDescription className="text-amber-400/80 text-xs font-medium">
                Disclaimer: Local health codes and regulations vary. Always verify requirements with
                your local health authority, labor board, and relevant regulatory bodies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.complianceNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    {note}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
