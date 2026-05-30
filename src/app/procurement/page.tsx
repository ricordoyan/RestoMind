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
import { ArrowLeft, Loader2, ShoppingCart, Ruler, MapPin, DollarSign, FileText, AlertCircle, ClipboardList } from "lucide-react";

const CUISINE_OPTIONS = [
  "Italian", "Chinese", "Japanese", "Mexican", "Indian", "Thai",
  "Vietnamese", "Korean", "American / Burger", "Pizza", "Sushi",
  "Mediterranean", "Middle Eastern", "French", "Seafood", "Steakhouse",
  "BBQ", "Café / Bakery", "Fast Casual", "Fine Dining",
  "Vegan / Vegetarian", "Latin American", "Dim Sum", "Tapas",
];

const LOADING_MESSAGES = [
  "Analyzing your restaurant concept...",
  "Identifying essential equipment...",
  "Researching market prices...",
  "Generating procurement checklist...",
];

export default function ProcurementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [cuisine, setCuisine] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!cuisine) {
      newErrors.cuisine = "Please select a cuisine type";
    }
    if (!squareFootage.trim()) {
      newErrors.squareFootage = "Kitchen square footage is required";
    } else if (Number(squareFootage) <= 0) {
      newErrors.squareFootage = "Square footage must be positive";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cuisine, squareFootage]);

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

      const response = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuisine,
          squareFootage: Number(squareFootage),
          location: location || undefined,
          budget: budget || undefined,
          notes: notes || undefined,
        }),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Procurement analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`procurement_report_${reportId}`, JSON.stringify(data));
      router.push(`/procurement-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message = error instanceof Error ? error.message : "Procurement analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [cuisine, squareFootage, location, budget, notes, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />

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
              <ShoppingCart className="text-emerald-400" /> Smart Procurement
            </CardTitle>
            <CardDescription className="text-slate-400">
              Get a tailored equipment and smallwares checklist with new vs. used price estimates.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Cuisine */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Cuisine Type <span className="text-rose-400">*</span>
              </Label>
              <Select
                value={cuisine}
                onValueChange={(val) => { setCuisine(val ?? ""); clearError("cuisine"); }}
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

            {/* Square Footage */}
            <div className="space-y-2">
              <Label htmlFor="sqft" className="text-slate-300">
                Kitchen Square Footage <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="sqft"
                  type="number"
                  placeholder="e.g. 600"
                  value={squareFootage}
                  onChange={(e) => { setSquareFootage(e.target.value); clearError("squareFootage"); }}
                  className={`${inputClass} pl-10 ${errors.squareFootage ? errorClass : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.squareFootage && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.squareFootage}
                </p>
              )}
              <p className="text-xs text-slate-500">Approximate size of your kitchen workspace.</p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-300">Location <span className="text-slate-500 font-normal">(optional)</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="location"
                  placeholder="City or region for local marketplace searches"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`${inputClass} pl-10`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-slate-300">Equipment Budget ($) <span className="text-slate-500 font-normal">(optional)</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g. 50000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={`${inputClass} pl-10`}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-slate-500">Total budget allocated for kitchen equipment and smallwares.</p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Additional Notes <span className="text-slate-500 font-normal">(optional)</span></Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-500 pointer-events-none" />
                <Textarea
                  id="notes"
                  placeholder="e.g. Planning a wood-fired pizza oven, need gluten-free prep area, high-volume expected..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white min-h-[80px] pl-10 pt-3 resize-y"
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
              className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[200px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Generate Checklist
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
