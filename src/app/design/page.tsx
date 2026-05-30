"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, ImageUp, Ruler, FileText, AlertCircle, Sparkles } from "lucide-react";

const STYLE_OPTIONS = [
  "Modern", "Industrial", "Warm / Rustic", "Minimalist", "Scandinavian",
  "Art Deco", "Farmhouse", "Coastal", "Eclectic", "Mid-Century Modern",
  "Bohemian", "Japanese Wabi-Sabi", "Mediterranean",
];

const LOADING_MESSAGES = [
  "Analyzing your space...",
  "Planning the layout...",
  "Curating materials and colors...",
  "Finding budget-friendly ideas...",
];

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DesignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [squareFootage, setSquareFootage] = useState("");
  const [style, setStyle] = useState("");
  const [notes, setNotes] = useState("");

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!squareFootage.trim()) {
      newErrors.squareFootage = "Square footage is required";
    } else if (Number(squareFootage) <= 0) {
      newErrors.squareFootage = "Square footage must be positive";
    }
    if (!style) {
      newErrors.style = "Please select a design style";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [squareFootage, style]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 10MB" }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
    const dataUrl = await readFileAsDataURL(file);
    setImagePreview(dataUrl);
    setImageBase64(dataUrl);
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

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

      const response = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          squareFootage: Number(squareFootage),
          style,
          notes: notes || undefined,
          image: imageBase64,
        }),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Design analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`design_report_${reportId}`, JSON.stringify(data));
      router.push(`/design-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message = error instanceof Error ? error.message : "Design analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [squareFootage, style, notes, imageBase64, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />

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
              <Sparkles className="text-violet-400" /> Interior Design Suggestion
            </CardTitle>
            <CardDescription className="text-slate-400">
              Upload a photo of your empty space or describe it, and get an AI-powered design plan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="text-slate-300">Space Photo <span className="text-slate-500 font-normal">(optional)</span></Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  imagePreview
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : "border-slate-700 bg-slate-950 hover:border-slate-600"
                }`}
              >
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Space preview"
                      className="max-h-64 mx-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-500/80 transition-colors text-sm"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <ImageUp className="w-10 h-10" />
                    <p className="text-sm font-medium">Click to upload a photo</p>
                    <p className="text-xs">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {errors.image && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.image}
                </p>
              )}
            </div>

            {/* Square Footage */}
            <div className="space-y-2">
              <Label htmlFor="sqft" className="text-slate-300">
                Square Footage <span className="text-rose-400">*</span>
              </Label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <Input
                  id="sqft"
                  type="number"
                  placeholder="e.g. 1500"
                  value={squareFootage}
                  onChange={(e) => { setSquareFootage(e.target.value); setErrors((p) => { const n = { ...p }; delete n.squareFootage; return n; }); }}
                  className={`${inputClass} pl-10 ${errors.squareFootage ? errorClass : ""}`}
                  disabled={isLoading}
                />
              </div>
              {errors.squareFootage && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.squareFootage}
                </p>
              )}
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label className="text-slate-300">
                Design Style <span className="text-rose-400">*</span>
              </Label>
              <Select value={style} onValueChange={(val) => { setStyle(val ?? ""); setErrors((p) => { const n = { ...p }; delete n.style; return n; }); }}>
                <SelectTrigger className={`${inputClass} ${errors.style ? errorClass : ""}`} disabled={isLoading}>
                  <SelectValue placeholder="Select your preferred style" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                  {STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.style && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.style}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Additional Notes <span className="text-slate-500 font-normal">(optional)</span></Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-500 pointer-events-none" />
                <Textarea
                  id="notes"
                  placeholder="e.g. Open kitchen concept, lots of natural light, need a private dining area..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white min-h-[100px] pl-10 pt-3 resize-y"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-slate-500">Describe any special requirements, existing features, or constraints.</p>
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
              className="bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[200px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate Design Plan
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
