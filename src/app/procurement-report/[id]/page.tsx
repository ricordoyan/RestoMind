"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, ShoppingCart, AlertCircle,
  ShieldAlert, ExternalLink, Scale, Utensils,
  Refrigerator, ChefHat, Sofa, Search,
} from "lucide-react";

type EquipmentItem = {
  name: string;
  essential: boolean;
  estimatedNewPrice: string;
  estimatedUsedPrice: string;
  notes: string;
  searchTerms: string[];
};

type Category = {
  category: string;
  icon: string;
  items: EquipmentItem[];
};

type ProcurementData = {
  equipmentByCategory: Category[];
  totalEstimatedNew: string;
  totalEstimatedUsed: string;
  scamTips: string[];
  marketplaceLinks: { platform: string; url: string; label: string }[];
  meta: {
    cuisine: string;
    squareFootage: number;
    location: string | null;
    budget: string | null;
  };
};

const ICON_MAP: Record<string, React.ElementType> = {
  cooking: ChefHat,
  prep: Utensils,
  refrigeration: Refrigerator,
  serving: Utensils,
  smallwares: Scale,
  furniture: Sofa,
  safety: ShieldAlert,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  cooking: "from-orange-500/10 to-red-500/10 border-orange-500/20",
  prep: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
  refrigeration: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20",
  serving: "from-amber-500/10 to-yellow-500/10 border-amber-500/20",
  smallwares: "from-slate-500/10 to-gray-500/10 border-slate-500/20",
  furniture: "from-violet-500/10 to-purple-500/10 border-violet-500/20",
  safety: "from-rose-500/10 to-pink-500/10 border-rose-500/20",
};

function loadProcurementReport(id: string): { data: ProcurementData | null; error: string } {
  try {
    const saved = localStorage.getItem(`procurement_report_${id}`);
    if (saved) return { data: JSON.parse(saved) as ProcurementData, error: "" };
    return { data: null, error: "Procurement report not found. Please start a new analysis." };
  } catch {
    return { data: null, error: "Failed to load procurement report data." };
  }
}

export default function ProcurementReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [{ data, error }] = useState<{ data: ProcurementData | null; error: string }>(() => {
    if (typeof window === "undefined" || !id || typeof id !== "string") {
      return { data: null, error: "Invalid report ID" };
    }
    return loadProcurementReport(id);
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Alert className="max-w-md bg-rose-500/10 border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/procurement")}>
          Start New Procurement
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading your procurement checklist...</p>
        </div>
      </div>
    );
  }

  const allItems = data.equipmentByCategory.flatMap((c) => c.items);
  const essentialCount = allItems.filter((i) => i.essential).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/procurement")} className="text-slate-400 hover:text-white shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-base sm:text-lg truncate">Procurement Checklist</h1>
        </div>
        <span className="hidden sm:block text-xs text-slate-500">
          {data.meta.cuisine} &middot; {data.meta.squareFootage} sq ft
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{data.meta.cuisine} Kitchen Checklist</h2>
            <p className="text-sm text-slate-400">
              {allItems.length} items ({essentialCount} essential) for a {data.meta.squareFootage.toLocaleString()} sq ft kitchen
              {data.meta.location ? ` in ${data.meta.location}` : ""}
            </p>
          </div>
          {/* Cost Summary */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm">
            <div className="bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-800 text-center min-w-[140px]">
              <p className="text-xs text-slate-500 mb-1">New Total</p>
              <p className="text-base sm:text-lg font-bold text-emerald-400">{data.totalEstimatedNew}</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-800 text-center min-w-[140px]">
              <p className="text-xs text-slate-500 mb-1">Used Total</p>
              <p className="text-base sm:text-lg font-bold text-amber-400">{data.totalEstimatedUsed}</p>
            </div>
          </div>
        </div>

        {/* Equipment Categories */}
        {data.equipmentByCategory.map((cat, catIdx) => {
          const Icon = ICON_MAP[cat.icon] || ShoppingCart;
          const gradient = CATEGORY_GRADIENTS[cat.icon] || "from-slate-500/10 to-gray-500/10 border-slate-500/20";
          return (
            <Card key={catIdx} className="bg-slate-900 border-slate-800 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Icon className="w-5 h-5 text-slate-300" />
                  {cat.category}
                </CardTitle>
                <CardDescription>
                  {cat.items.filter((i) => i.essential).length} essential &middot; {cat.items.filter((i) => !i.essential).length} recommended
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} className={`p-4 rounded-xl border ${gradient}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm sm:text-base">{item.name}</span>
                            <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                              item.essential
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {item.essential ? "Essential" : "Optional"}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">{item.notes}</p>
                          )}
                          {item.searchTerms.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <Search className="w-3 h-3 text-slate-600 shrink-0" />
                              {item.searchTerms.map((term, tIdx) => (
                                <a
                                  key={tIdx}
                                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(term)}&_sacat=11772`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                                >
                                  {term}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm shrink-0">
                          <div className="text-right min-w-[90px]">
                            <p className="text-slate-500">New</p>
                            <p className="font-semibold text-emerald-400">{item.estimatedNewPrice}</p>
                          </div>
                          <div className="text-right min-w-[90px]">
                            <p className="text-slate-500">Used</p>
                            <p className="font-semibold text-amber-400">{item.estimatedUsedPrice}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Marketplace Links */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-purple-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="text-indigo-400 w-5 h-5" /> Find Equipment on Marketplaces
            </CardTitle>
            <CardDescription>Click to search these platforms for your equipment needs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.marketplaceLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-colors group"
                >
                  <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{link.platform}</p>
                    <p className="text-xs text-slate-500">{link.label}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scam Avoidance Tips */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-rose-400 to-amber-400" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-rose-400">
              <ShieldAlert className="w-5 h-5" /> Scam Avoidance Tips
            </CardTitle>
            <CardDescription>Stay safe when buying used restaurant equipment.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {data.scamTips.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-sm font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-0.5">{tip}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
