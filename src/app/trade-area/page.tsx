"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlacesAutocomplete } from "@/components/places-autocomplete";
import { ArrowLeft, Loader2, AlertCircle, MapPin, Layers } from "lucide-react";

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
  "Mapping the trade area...",
  "Scanning nearby competitors...",
  "Profiling the customer base...",
  "Assessing saturation...",
];

type PlaceResult = {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
};

export default function TradeAreaPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [place, setPlace] = useState<PlaceResult>({ address: "", placeId: "", lat: 0, lng: 0 });
  const [cuisine, setCuisine] = useState("");
  const [notes, setNotes] = useState("");

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!place.address.trim()) {
      newErrors.location = "Location is required";
    }
    if (!cuisine) {
      newErrors.cuisine = "Please select a cuisine type";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [place.address, cuisine]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");
    setLoadingMessageIndex(0);

    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    try {
      const reportId = Date.now().toString();

      const body: {
        address: string;
        cuisine: string;
        notes?: string;
        coordinates?: { lat: number; lng: number };
      } = {
        address: place.address,
        cuisine,
      };
      if (notes.trim()) body.notes = notes.trim();
      if (place.lat && place.lng) body.coordinates = { lat: place.lat, lng: place.lng };

      const response = await fetch("/api/trade-area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || `Trade area analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`trade_area_report_${reportId}`, JSON.stringify(data));
      router.push(`/trade-area-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message = error instanceof Error ? error.message : "Trade area analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [place, cuisine, notes, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="mb-6">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => router.push("/")}>
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
              <Layers className="text-cyan-400" /> Trade Area Analysis
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter a location to analyze the surrounding trade area in concentric rings — revealing competitor density,
              customer segments, and market saturation within 1.5 km of your site.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Location <span className="text-rose-400">*</span>
                </span>
              </Label>
              <div className={errors.location ? errorClass + " rounded-md" : ""}>
                <PlacesAutocomplete
                  value={place.address}
                  onChange={(p) => {
                    setPlace(p);
                    setErrors((prev) => { const n = { ...prev }; delete n.location; return n; });
                  }}
                  onError={() => {}}
                  disabled={isLoading}
                />
              </div>
              {errors.location && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.location}
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
                  setErrors((prev) => { const n = { ...prev }; delete n.cuisine; return n; });
                }}
              >
                <SelectTrigger className={`${inputClass} ${errors.cuisine ? errorClass : ""}`} disabled={isLoading}>
                  <SelectValue placeholder="Select your cuisine type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                  {CUISINE_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
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
                Additional Notes <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. Targeting lunch crowds, near a business district, planning a mid-range price point..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white min-h-[100px] resize-y"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Any context about your concept or target customer helps refine the analysis.
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
              className="bg-gradient-to-r from-cyan-500 to-sky-500 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[220px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Analyze Trade Area
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
