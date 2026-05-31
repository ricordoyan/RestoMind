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
  ListChecks,
  Utensils,
  Users,
  AlertCircle,
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

const SERVICE_STYLE_OPTIONS = [
  "Quick Service",
  "Fast Casual",
  "Casual Dining",
  "Fine Dining",
  "Café / Bakery",
  "Bar / Pub",
];

const LOADING_MESSAGES = [
  "Drafting daily checklists...",
  "Writing food-safety SOPs...",
  "Building training modules...",
  "Planning onboarding...",
];

export default function PlaybookPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [serviceStyle, setServiceStyle] = useState("");
  const [teamSize, setTeamSize] = useState("");
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
    if (!serviceStyle) {
      newErrors.serviceStyle = "Please select a service style";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cuisine, serviceStyle]);

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

      const response = await fetch("/api/playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim() || undefined,
          cuisine,
          serviceStyle,
          teamSize: teamSize ? Number(teamSize) : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || `Playbook generation failed (${response.status})`);
      }

      const data: unknown = await response.json();
      localStorage.setItem(`playbook_report_${reportId}`, JSON.stringify(data));
      router.push(`/playbook-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message =
        error instanceof Error ? error.message : "Playbook generation failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [restaurantName, cuisine, serviceStyle, teamSize, notes, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

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
              <ListChecks className="text-indigo-400" /> Ops Playbook Generator
            </CardTitle>
            <CardDescription className="text-slate-400">
              Generate daily checklists, food-safety SOPs, and role-based staff training for your
              restaurant.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Restaurant Name (optional) */}
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="text-slate-300">
                Restaurant Name{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="restaurantName"
                  placeholder="e.g. The Golden Spoon"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className={`${inputClass} pl-10`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Cuisine (required) */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Cuisine Type <span className="text-indigo-400">*</span>
              </Label>
              <Select
                value={cuisine}
                onValueChange={(val) => {
                  setCuisine(val ?? "");
                  clearError("cuisine");
                }}
              >
                <SelectTrigger
                  className={`${inputClass} ${errors.cuisine ? errorClass : ""}`}
                  disabled={isLoading}
                >
                  <SelectValue placeholder="Select cuisine type" />
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

            {/* Service Style (required) */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Service Style <span className="text-indigo-400">*</span>
              </Label>
              <Select
                value={serviceStyle}
                onValueChange={(val) => {
                  setServiceStyle(val ?? "");
                  clearError("serviceStyle");
                }}
              >
                <SelectTrigger
                  className={`${inputClass} ${errors.serviceStyle ? errorClass : ""}`}
                  disabled={isLoading}
                >
                  <SelectValue placeholder="Select service style" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {SERVICE_STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceStyle && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.serviceStyle}
                </p>
              )}
            </div>

            {/* Team Size (optional) */}
            <div className="space-y-2">
              <Label htmlFor="teamSize" className="text-slate-300">
                Team Size{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="teamSize"
                  type="number"
                  min={1}
                  placeholder="e.g. 12"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className={`${inputClass} pl-10`}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-slate-500">
                Number of staff helps tailor the training plan.
              </p>
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">
                Additional Notes{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. Outdoor seating, seasonal menu, kosher kitchen, allergy-aware..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white min-h-[100px] resize-y"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500">
                Any special considerations, certifications, or operational quirks.
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
              className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[220px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> Generate Ops Playbook
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
