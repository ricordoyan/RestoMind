"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Megaphone, MapPin, Utensils, Users, AlertCircle, Sparkles } from "lucide-react";

const CUISINE_OPTIONS = [
  "Italian", "Chinese", "Japanese", "Mexican", "Indian", "Thai",
  "Vietnamese", "Korean", "American / Burger", "Pizza", "Sushi",
  "Mediterranean", "Middle Eastern", "French", "Seafood", "Steakhouse",
  "BBQ", "Café / Bakery", "Fast Casual", "Fine Dining",
  "Vegan / Vegetarian", "Latin American",
];

const LOADING_MESSAGES = [
  "Crafting your brand identity...",
  "Writing social media captions...",
  "Designing your grand opening...",
  "Building your marketing checklist...",
];

export default function MarketingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [name, setName] = useState("");
  const [concept, setConcept] = useState("");
  const [targetCustomers, setTargetCustomers] = useState("");
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Restaurant name is required";
    }
    if (!concept.trim()) {
      newErrors.concept = "Concept description is required";
    }
    if (!targetCustomers.trim()) {
      newErrors.targetCustomers = "Target customers is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, concept, targetCustomers]);

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

      const response = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          concept: concept.trim(),
          targetCustomers: targetCustomers.trim(),
          location: location.trim() || undefined,
          cuisine: cuisine || undefined,
        }),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Marketing analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`marketing_report_${reportId}`, JSON.stringify(data));
      router.push(`/marketing-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message = error instanceof Error ? error.message : "Marketing analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [name, concept, targetCustomers, location, cuisine, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-rose-900/20 to-transparent pointer-events-none" />

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
              <Megaphone className="text-rose-400" /> Marketing Co-Pilot
            </CardTitle>
            <CardDescription className="text-slate-400">
              Generate social media content, branding concepts, and a grand opening plan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">
                Restaurant Name <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="name"
                  placeholder="e.g. The Golden Spoon, Bella Cucina"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError("name"); }}
                  className={`${inputClass} pl-10 ${errors.name ? errorClass : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Concept */}
            <div className="space-y-2">
              <Label htmlFor="concept" className="text-slate-300">
                Concept <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 w-5 h-5 text-slate-500 pointer-events-none" />
                <Textarea
                  id="concept"
                  placeholder="e.g. Farm-to-table Italian with an open kitchen, communal dining, and a wood-fired oven. Rustic-chic vibes with natural materials."
                  value={concept}
                  onChange={(e) => { setConcept(e.target.value); clearError("concept"); }}
                  className={`bg-slate-950 border-slate-700 text-white min-h-[100px] pl-10 pt-3 resize-y ${errors.concept ? errorClass : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.concept && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.concept}
                </p>
              )}
              <p className="text-xs text-slate-500">Describe the vibe, unique selling points, and what makes it special.</p>
            </div>

            {/* Target Customers */}
            <div className="space-y-2">
              <Label htmlFor="audience" className="text-slate-300">
                Target Customers <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-slate-500 pointer-events-none" />
                <Textarea
                  id="audience"
                  placeholder="e.g. Young professionals aged 25-40, families, foodies who value sustainability, date-night couples"
                  value={targetCustomers}
                  onChange={(e) => { setTargetCustomers(e.target.value); clearError("targetCustomers"); }}
                  className={`bg-slate-950 border-slate-700 text-white min-h-[80px] pl-10 pt-3 resize-y ${errors.targetCustomers ? errorClass : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.targetCustomers && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.targetCustomers}
                </p>
              )}
            </div>

            {/* Cuisine (optional) */}
            <div className="space-y-2">
              <Label className="text-slate-300">Cuisine <span className="text-slate-500 font-normal">(optional)</span></Label>
              <Select value={cuisine} onValueChange={(val) => setCuisine(val ?? "")}>
                <SelectTrigger className={inputClass} disabled={isLoading}>
                  <SelectValue placeholder="Select cuisine type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                  {CUISINE_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location (optional) */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-300">Location <span className="text-slate-500 font-normal">(optional)</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="location"
                  placeholder="City or neighborhood"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`${inputClass} pl-10`}
                  disabled={isLoading}
                />
              </div>
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
              className="bg-gradient-to-r from-rose-500 to-pink-400 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[200px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Generate Marketing Plan
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
