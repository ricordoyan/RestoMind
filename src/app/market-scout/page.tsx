"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  AlertCircle,
  Telescope,
} from "lucide-react";

const CUISINE_OPTIONS = [
  "Italian",
  "Chinese",
  "Japanese",
  "Mexican",
  "Indian",
  "Thai",
  "Vietnamese",
  "Korean",
  "American / Burger",
  "Pizza",
  "Sushi",
  "Mediterranean",
  "Middle Eastern",
  "French",
  "Seafood",
  "Steakhouse",
  "BBQ",
  "Café / Bakery",
  "Fast Casual",
  "Fine Dining",
  "Vegan / Vegetarian",
  "Latin American",
];

const LOADING_MESSAGES = [
  "Scanning the metro...",
  "Mapping candidate districts...",
  "Counting local competition...",
  "Ranking white-space opportunities...",
];

export default function MarketScoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [city, setCity] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [notes, setNotes] = useState("");

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!city.trim()) {
      newErrors.city = "City or metro area is required";
    }
    if (!cuisine) {
      newErrors.cuisine = "Please select a cuisine type";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [city, cuisine]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");
    setLoadingMessageIndex(0);

    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 5000);

    try {
      const reportId = Date.now().toString();

      const response = await fetch("/api/market-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim(),
          cuisine,
          notes: notes.trim() || undefined,
        }),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Market Scout analysis failed (${response.status})`
        );
      }

      const data = await response.json();
      localStorage.setItem(
        `market_scout_report_${reportId}`,
        JSON.stringify(data)
      );
      router.push(`/market-scout-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message =
        error instanceof Error
          ? error.message
          : "Market Scout analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [city, cuisine, notes, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
          </Button>
        </div>

        {apiError && (
          <Alert className="mb-4 bg-rose-500/10 border-rose-500/30 text-rose-300">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Telescope className="text-emerald-400" /> Market Scout
            </CardTitle>
            <CardDescription className="text-slate-400">
              Find the best neighborhoods to open your next restaurant. Enter a
              city and cuisine type — we scan multiple districts, count real
              competitor density, and rank white-space opportunities where demand
              likely outstrips supply.
            </CardDescription>
            <p className="text-xs text-slate-500 pt-1">
              Scanning multiple neighborhoods typically takes 20–30 seconds.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-slate-300">
                City or Metro Area <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="city"
                  type="text"
                  placeholder="e.g. Merced, CA"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.city;
                      return n;
                    });
                  }}
                  className={`${inputClass} pl-10 ${errors.city ? errorClass : ""}`}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
              {errors.city && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.city}
                </p>
              )}
            </div>

            {/* Cuisine */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Cuisine Type <span className="text-rose-400">*</span>
              </Label>
              <Select
                value={cuisine}
                onValueChange={(val) => {
                  setCuisine(val ?? "");
                  setErrors((p) => {
                    const n = { ...p };
                    delete n.cuisine;
                    return n;
                  });
                }}
              >
                <SelectTrigger
                  className={`${inputClass} ${errors.cuisine ? errorClass : ""}`}
                  disabled={isLoading}
                >
                  <SelectValue placeholder="Select the cuisine you plan to serve" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                  {CUISINE_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cuisine && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.cuisine}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">
                Additional Notes{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. Targeting families, need parking, prefer up-and-coming areas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white min-h-[90px] resize-y"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Any preferences or constraints that should influence neighborhood
                selection.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-800 pt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isLoading}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-500 to-lime-500 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[220px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Telescope className="w-4 h-4" /> Find Best Neighborhoods
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
