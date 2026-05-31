"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlacesAutocomplete } from "@/components/places-autocomplete";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  GitCompare,
  MapPin,
  DollarSign,
} from "lucide-react";

const CUISINE_OPTIONS = [
  "Italian", "Chinese", "Japanese", "Mexican", "Indian", "Thai",
  "Vietnamese", "Korean", "American / Burger", "Pizza", "Sushi",
  "Mediterranean", "Middle Eastern", "French", "Seafood", "Steakhouse",
  "BBQ", "Café / Bakery", "Fast Casual", "Fine Dining",
  "Vegan / Vegetarian", "Latin American",
];

const LOADING_MESSAGES = [
  "Locating both sites...",
  "Measuring the distance...",
  "Modeling trade-area overlap...",
  "Estimating sales transfer...",
];

type PlaceResult = {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
};

type PlaceState = {
  address: string;
  placeId: string;
  coords: { lat: number; lng: number } | null;
};

const EMPTY_PLACE: PlaceState = { address: "", placeId: "", coords: null };

export default function ImpactPage() {
  const router = useRouter();

  const [existingPlace, setExistingPlace] = useState<PlaceState>(EMPTY_PLACE);
  const [newPlace, setNewPlace] = useState<PlaceState>(EMPTY_PLACE);
  const [cuisine, setCuisine] = useState("");
  const [existingRevenue, setExistingRevenue] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleExistingChange = useCallback(
    (place: PlaceResult) => {
      setExistingPlace({
        address: place.address,
        placeId: place.placeId,
        coords: place.lat ? { lat: place.lat, lng: place.lng } : null,
      });
      clearError("existing");
    },
    [clearError]
  );

  const handleNewChange = useCallback(
    (place: PlaceResult) => {
      setNewPlace({
        address: place.address,
        placeId: place.placeId,
        coords: place.lat ? { lat: place.lat, lng: place.lng } : null,
      });
      clearError("new");
    },
    [clearError]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!existingPlace.address.trim()) {
      newErrors.existing = "Existing location address is required";
    }
    if (!newPlace.address.trim()) {
      newErrors.new = "Proposed new location address is required";
    }
    if (!cuisine) {
      newErrors.cuisine = "Please select a cuisine type";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [existingPlace.address, newPlace.address, cuisine]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");
    setLoadingMessageIndex(0);

    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3500);

    try {
      const reportId = Date.now().toString();

      const payload = {
        existingAddress: existingPlace.address,
        existingCoords: existingPlace.coords ?? undefined,
        newAddress: newPlace.address,
        newCoords: newPlace.coords ?? undefined,
        cuisine,
        existingMonthlyRevenue: existingRevenue ? Number(existingRevenue) : null,
      };

      const response = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? `Analysis failed (${response.status})`);
      }

      const data: unknown = await response.json();
      localStorage.setItem(`impact_report_${reportId}`, JSON.stringify(data));
      router.push(`/impact-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message = error instanceof Error ? error.message : "Failed to run impact analysis. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [existingPlace, newPlace, cuisine, existingRevenue, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      {/* Amber glow background accent */}
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-amber-900/15 to-transparent pointer-events-none" />

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

        {/* Page header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Impact{" "}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Analysis
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">Cannibalization &amp; trade-area overlap</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-slate-300 leading-relaxed">
              Planning a second location? This tool estimates how much revenue your{" "}
              <span className="text-amber-300 font-medium">existing store</span> would lose to a{" "}
              <span className="text-orange-300 font-medium">new one nearby</span> — so you can decide
              whether the new site adds net-new customers or mostly steals from yourself.
            </p>
          </div>
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
              <MapPin className="text-amber-400" /> Site Details
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter both locations and the cuisine type to model trade-area overlap.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Existing location */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Existing Location <span className="text-rose-400">*</span>
              </Label>
              <p className="text-xs text-slate-500">The store already open whose sales we want to protect.</p>
              <PlacesAutocomplete
                value={existingPlace.address}
                onChange={handleExistingChange}
                onError={(msg) => setErrors((prev) => ({ ...prev, existing: msg }))}
                disabled={isLoading}
              />
              {errors.existing && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.existing}
                </p>
              )}
              {existingPlace.address && !errors.existing && (
                <p className="text-xs text-emerald-400 mt-1">
                  {existingPlace.coords ? "Location verified" : "Location set"}
                </p>
              )}
            </div>

            {/* New location */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Proposed New Location <span className="text-rose-400">*</span>
              </Label>
              <p className="text-xs text-slate-500">The site you are considering opening next.</p>
              <PlacesAutocomplete
                value={newPlace.address}
                onChange={handleNewChange}
                onError={(msg) => setErrors((prev) => ({ ...prev, new: msg }))}
                disabled={isLoading}
              />
              {errors.new && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.new}
                </p>
              )}
              {newPlace.address && !errors.new && (
                <p className="text-xs text-emerald-400 mt-1">
                  {newPlace.coords ? "Location verified" : "Location set"}
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
                  clearError("cuisine");
                }}
                disabled={isLoading}
              >
                <SelectTrigger className={`${inputClass} ${errors.cuisine ? errorClass : ""}`}>
                  <SelectValue placeholder="Select your cuisine type" />
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

            {/* Optional revenue */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Existing Store Monthly Revenue ($)
                <span className="text-xs text-slate-500 font-normal">(optional)</span>
              </Label>
              <Input
                type="number"
                placeholder="e.g. 85000"
                value={existingRevenue}
                onChange={(e) => setExistingRevenue(e.target.value)}
                className={inputClass}
                disabled={isLoading}
                min={0}
              />
              <p className="text-xs text-slate-500">
                Provide this for dollar-range transfer estimates; otherwise you will get percentage ranges only.
              </p>
            </div>
          </CardContent>

          <div className="px-6 pb-6 pt-2 border-t border-slate-800 flex flex-col sm:flex-row justify-between gap-3 mt-2">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white w-full sm:w-auto"
              onClick={() => router.push("/")}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[220px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <>
                  Run Impact Analysis <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
