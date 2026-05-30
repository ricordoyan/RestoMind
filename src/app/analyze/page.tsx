"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PlacesAutocomplete } from "@/components/places-autocomplete";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  ChefHat,
  Store,
  DollarSign,
  ClipboardCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building2,
  Receipt,
} from "lucide-react";

const CUISINE_OPTIONS = [
  "Italian", "Chinese", "Japanese", "Mexican", "Indian", "Thai",
  "Vietnamese", "Korean", "American / Burger", "Pizza", "Sushi",
  "Mediterranean", "Middle Eastern", "French", "Seafood", "Steakhouse",
  "BBQ", "Café / Bakery", "Fast Casual", "Fine Dining",
  "Vegan / Vegetarian", "Latin American",
];

type PlaceResult = {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
};

type FormData = {
  address: string;
  placeId: string;
  coordinates: { lat: number; lng: number } | null;
  cuisine: string;
  model: "takeover" | "lease";
  takeoverDetails: {
    askingPrice: string;
    monthlyRevenue: string;
    yearsInOperation: string;
    includedEquipment: string;
  };
  leaseDetails: {
    monthlyRent: string;
    squareFootage: string;
    leaseTerm: string;
    condition: string;
  };
  budget: string;
  targetRevenue: string;
};

const STEPS = [
  { label: "Location", icon: MapPin },
  { label: "Cuisine", icon: ChefHat },
  { label: "Business Model", icon: Store },
  { label: "Finances", icon: DollarSign },
  { label: "Review", icon: ClipboardCheck },
];

const LOADING_MESSAGES = [
  "Scouting the neighborhood...",
  "Finding nearby competitors...",
  "Analyzing market data...",
  "Generating AI report...",
];

const INITIAL_FORM: FormData = {
  address: "",
  placeId: "",
  coordinates: null,
  cuisine: "",
  model: "lease",
  takeoverDetails: {
    askingPrice: "",
    monthlyRevenue: "",
    yearsInOperation: "",
    includedEquipment: "",
  },
  leaseDetails: {
    monthlyRent: "",
    squareFootage: "",
    leaseTerm: "",
    condition: "",
  },
  budget: "",
  targetRevenue: "",
};

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const totalSteps = STEPS.length;
  const progress = Math.round(((step - 1) / totalSteps) * 100);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const updateNested = useCallback(
    (parent: "takeoverDetails" | "leaseDetails", field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [field]: value },
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`${parent}.${field}`];
        return next;
      });
    },
    []
  );

  const handlePlaceChange = useCallback((place: PlaceResult) => {
    setFormData((prev) => ({
      ...prev,
      address: place.address,
      placeId: place.placeId,
      coordinates: place.lat ? { lat: place.lat, lng: place.lng } : null,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      return next;
    });
  }, []);

  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.address.trim()) {
          newErrors.address = "Location address is required";
        }
        break;
      case 2:
        if (!formData.cuisine) {
          newErrors.cuisine = "Please select a cuisine type";
        }
        break;
      case 3:
        if (!formData.model) {
          newErrors.model = "Please select a business model";
        } else if (formData.model === "takeover") {
          if (!formData.takeoverDetails.askingPrice.trim()) {
            newErrors["takeoverDetails.askingPrice"] = "Asking price is required";
          } else if (Number(formData.takeoverDetails.askingPrice) <= 0) {
            newErrors["takeoverDetails.askingPrice"] = "Asking price must be positive";
          }
        } else {
          if (!formData.leaseDetails.monthlyRent.trim()) {
            newErrors["leaseDetails.monthlyRent"] = "Monthly rent is required";
          } else if (Number(formData.leaseDetails.monthlyRent) <= 0) {
            newErrors["leaseDetails.monthlyRent"] = "Rent must be positive";
          }
          if (!formData.leaseDetails.squareFootage.trim()) {
            newErrors["leaseDetails.squareFootage"] = "Square footage is required";
          } else if (Number(formData.leaseDetails.squareFootage) <= 0) {
            newErrors["leaseDetails.squareFootage"] = "Square footage must be positive";
          }
          if (!formData.leaseDetails.leaseTerm.trim()) {
            newErrors["leaseDetails.leaseTerm"] = "Lease term is required";
          } else if (Number(formData.leaseDetails.leaseTerm) <= 0) {
            newErrors["leaseDetails.leaseTerm"] = "Lease term must be positive";
          }
          if (!formData.leaseDetails.condition) {
            newErrors["leaseDetails.condition"] = "Please select a condition";
          }
        }
        break;
      case 4:
        if (!formData.budget.trim()) {
          newErrors.budget = "Total budget is required";
        } else if (Number(formData.budget) <= 0) {
          newErrors.budget = "Budget must be positive";
        }
        if (!formData.targetRevenue.trim()) {
          newErrors.targetRevenue = "Target monthly revenue is required";
        } else if (Number(formData.targetRevenue) <= 0) {
          newErrors.targetRevenue = "Target revenue must be positive";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  }, [validateStep, totalSteps]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    setApiError("");
    setLoadingMessageIndex(0);

    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);

    try {
      const reportId = Date.now().toString();

      const payload = {
        address: formData.address,
        placeId: formData.placeId || undefined,
        coordinates: formData.coordinates || undefined,
        cuisine: formData.cuisine,
        model: formData.model,
        takeoverDetails: formData.model === "takeover"
          ? {
              askingPrice: Number(formData.takeoverDetails.askingPrice),
              monthlyRevenue: formData.takeoverDetails.monthlyRevenue
                ? Number(formData.takeoverDetails.monthlyRevenue)
                : null,
              yearsInOperation: formData.takeoverDetails.yearsInOperation
                ? Number(formData.takeoverDetails.yearsInOperation)
                : null,
              includedEquipment: formData.takeoverDetails.includedEquipment || null,
            }
          : null,
        leaseDetails: formData.model === "lease"
          ? {
              monthlyRent: Number(formData.leaseDetails.monthlyRent),
              squareFootage: Number(formData.leaseDetails.squareFootage),
              leaseTerm: Number(formData.leaseDetails.leaseTerm),
              condition: formData.leaseDetails.condition,
            }
          : null,
        budget: Number(formData.budget),
        targetRevenue: Number(formData.targetRevenue),
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`report_${reportId}`, JSON.stringify(data));
      router.push(`/report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message = error instanceof Error ? error.message : "Failed to generate report. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [formData, validateStep, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-12";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="mb-6">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
          </Button>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm font-medium text-slate-400">
            <span>Step {step} of {totalSteps}</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />

          {/* Step indicator dots */}
          <div className="flex items-center justify-between mt-3">
            {STEPS.map((s, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === step;
              const isPast = stepNum < step;
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isPast
                        ? "bg-indigo-500/20 text-indigo-400"
                        : isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-800 text-slate-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] hidden sm:block ${
                      isActive ? "text-indigo-300" : "text-slate-600"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
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
              {step === 1 && <><MapPin className="text-indigo-400" /> Location Address</>}
              {step === 2 && <><ChefHat className="text-teal-400" /> Cuisine Type</>}
              {step === 3 && <><Store className="text-emerald-400" /> Business Model</>}
              {step === 4 && <><DollarSign className="text-amber-400" /> Finances</>}
              {step === 5 && <><ClipboardCheck className="text-indigo-400" /> Review & Submit</>}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 1 && "Enter the location where you plan to open your restaurant."}
              {step === 2 && "What type of cuisine will your restaurant serve?"}
              {step === 3 && "Tell us about your business model and space details."}
              {step === 4 && "Set your budget and revenue targets."}
              {step === 5 && "Review everything before we generate your AI-powered report."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-300">
                  Target Address <span className="text-rose-400">*</span>
                </Label>
                <PlacesAutocomplete
                  value={formData.address}
                  onChange={handlePlaceChange}
                  onError={(msg) => setErrors((prev) => ({ ...prev, address: msg }))}
                />
                {errors.address && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.address}
                  </p>
                )}
                {formData.address && !errors.address && (
                  <p className="text-xs text-emerald-400 mt-1">
                    {formData.coordinates ? "✓ Location verified" : "Location set"}
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Cuisine */}
            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="cuisine" className="text-slate-300">
                  Cuisine Type <span className="text-rose-400">*</span>
                </Label>
                <Select
                  value={formData.cuisine}
                   onValueChange={(val) => updateField("cuisine", val ?? "")}
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
            )}

            {/* Step 3: Business Model */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Business Model <span className="text-rose-400">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateField("model", "lease")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.model === "lease"
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <Building2 className="w-5 h-5 mb-2" />
                      <p className="font-semibold text-sm">Lease Empty Space</p>
                      <p className="text-xs mt-1 opacity-70">Start from scratch in a vacant property</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("model", "takeover")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.model === "takeover"
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <Receipt className="w-5 h-5 mb-2" />
                      <p className="font-semibold text-sm">Takeover Existing</p>
                      <p className="text-xs mt-1 opacity-70">Buy an existing restaurant business</p>
                    </button>
                  </div>
                  {errors.model && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.model}
                    </p>
                  )}
                </div>

                {/* Takeover Details */}
                {formData.model === "takeover" && (
                  <div className="space-y-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <p className="text-sm font-medium text-slate-400">Takeover Details</p>
                    <div className="space-y-2">
                      <Label htmlFor="askingPrice" className="text-slate-300">
                        Asking Price ($) <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        id="askingPrice"
                        type="number"
                        placeholder="e.g. 150000"
                        value={formData.takeoverDetails.askingPrice}
                        onChange={(e) => updateNested("takeoverDetails", "askingPrice", e.target.value)}
                        className={`${inputClass} ${errors["takeoverDetails.askingPrice"] ? errorClass : ""}`}
                      />
                      {errors["takeoverDetails.askingPrice"] && (
                        <p className="text-xs text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors["takeoverDetails.askingPrice"]}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monthlyRevenue" className="text-slate-300">Current Monthly Revenue ($)</Label>
                        <Input
                          id="monthlyRevenue"
                          type="number"
                          placeholder="e.g. 30000"
                          value={formData.takeoverDetails.monthlyRevenue}
                          onChange={(e) => updateNested("takeoverDetails", "monthlyRevenue", e.target.value)}
                          className={inputClass}
                        />
                        <p className="text-[10px] text-slate-600">Optional, but helpful for analysis</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearsInOperation" className="text-slate-300">Years in Operation</Label>
                        <Input
                          id="yearsInOperation"
                          type="number"
                          placeholder="e.g. 5"
                          value={formData.takeoverDetails.yearsInOperation}
                          onChange={(e) => updateNested("takeoverDetails", "yearsInOperation", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="includedEquipment" className="text-slate-300">Included Equipment</Label>
                      <Input
                        id="includedEquipment"
                        placeholder="e.g. Full kitchen, POS system, furniture"
                        value={formData.takeoverDetails.includedEquipment}
                        onChange={(e) => updateNested("takeoverDetails", "includedEquipment", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* Lease Details */}
                {formData.model === "lease" && (
                  <div className="space-y-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <p className="text-sm font-medium text-slate-400">Lease Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monthlyRent" className="text-slate-300">
                          Monthly Rent ($) <span className="text-rose-400">*</span>
                        </Label>
                        <Input
                          id="monthlyRent"
                          type="number"
                          placeholder="e.g. 5000"
                          value={formData.leaseDetails.monthlyRent}
                          onChange={(e) => updateNested("leaseDetails", "monthlyRent", e.target.value)}
                          className={`${inputClass} ${errors["leaseDetails.monthlyRent"] ? errorClass : ""}`}
                        />
                        {errors["leaseDetails.monthlyRent"] && (
                          <p className="text-xs text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors["leaseDetails.monthlyRent"]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="squareFootage" className="text-slate-300">
                          Square Footage <span className="text-rose-400">*</span>
                        </Label>
                        <Input
                          id="squareFootage"
                          type="number"
                          placeholder="e.g. 1500"
                          value={formData.leaseDetails.squareFootage}
                          onChange={(e) => updateNested("leaseDetails", "squareFootage", e.target.value)}
                          className={`${inputClass} ${errors["leaseDetails.squareFootage"] ? errorClass : ""}`}
                        />
                        {errors["leaseDetails.squareFootage"] && (
                          <p className="text-xs text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors["leaseDetails.squareFootage"]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="leaseTerm" className="text-slate-300">
                          Lease Term (years) <span className="text-rose-400">*</span>
                        </Label>
                        <Input
                          id="leaseTerm"
                          type="number"
                          placeholder="e.g. 5"
                          value={formData.leaseDetails.leaseTerm}
                          onChange={(e) => updateNested("leaseDetails", "leaseTerm", e.target.value)}
                          className={`${inputClass} ${errors["leaseDetails.leaseTerm"] ? errorClass : ""}`}
                        />
                        {errors["leaseDetails.leaseTerm"] && (
                          <p className="text-xs text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors["leaseDetails.leaseTerm"]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="condition" className="text-slate-300">
                          Condition <span className="text-rose-400">*</span>
                        </Label>
                        <Select
                          value={formData.leaseDetails.condition}
                          onValueChange={(val) => updateNested("leaseDetails", "condition", val ?? "")}
                        >
                          <SelectTrigger
                            className={`${inputClass} ${errors["leaseDetails.condition"] ? errorClass : ""}`}
                          >
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-white">
                            <SelectItem value="new">New construction</SelectItem>
                            <SelectItem value="good">Good condition</SelectItem>
                            <SelectItem value="fair">Fair condition</SelectItem>
                            <SelectItem value="needs_renovation">Needs renovation</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors["leaseDetails.condition"] && (
                          <p className="text-xs text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors["leaseDetails.condition"]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Finances */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-slate-300">
                    Total Available Capital ($) <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g. 200000"
                    value={formData.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    className={`${inputClass} ${errors.budget ? errorClass : ""}`}
                  />
                  {errors.budget && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.budget}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Include build-out costs, equipment, permits, and working capital.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRevenue" className="text-slate-300">
                    Desired Monthly Revenue ($) <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    id="targetRevenue"
                    type="number"
                    placeholder="e.g. 50000"
                    value={formData.targetRevenue}
                    onChange={(e) => updateField("targetRevenue", e.target.value)}
                    className={`${inputClass} ${errors.targetRevenue ? errorClass : ""}`}
                  />
                  {errors.targetRevenue && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {errors.targetRevenue}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4 text-slate-300 bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Location</p>
                    <p className="font-medium text-white text-sm mt-1">{formData.address || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Cuisine</p>
                    <p className="font-medium text-white text-sm mt-1">{formData.cuisine || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Business Model</p>
                    <p className="font-medium text-white text-sm mt-1 capitalize">
                      {formData.model === "takeover" ? "Takeover (buy existing)" : "Lease empty space"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Budget & Target</p>
                    <p className="font-medium text-white text-sm mt-1">
                      ${Number(formData.budget).toLocaleString()} capital / ${Number(formData.targetRevenue).toLocaleString()}/mo target
                    </p>
                  </div>
                </div>

                {formData.model === "takeover" && (
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Takeover Details</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <p>Asking Price: <span className="text-white">${Number(formData.takeoverDetails.askingPrice).toLocaleString()}</span></p>
                      {formData.takeoverDetails.monthlyRevenue && (
                        <p>Monthly Revenue: <span className="text-white">${Number(formData.takeoverDetails.monthlyRevenue).toLocaleString()}</span></p>
                      )}
                      {formData.takeoverDetails.yearsInOperation && (
                        <p>Years Open: <span className="text-white">{formData.takeoverDetails.yearsInOperation}</span></p>
                      )}
                      {formData.takeoverDetails.includedEquipment && (
                        <p className="col-span-2">Equipment: <span className="text-white">{formData.takeoverDetails.includedEquipment}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {formData.model === "lease" && (
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Lease Details</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <p>Monthly Rent: <span className="text-white">${Number(formData.leaseDetails.monthlyRent).toLocaleString()}</span></p>
                      <p>Square Footage: <span className="text-white">{Number(formData.leaseDetails.squareFootage).toLocaleString()} sq ft</span></p>
                      <p>Lease Term: <span className="text-white">{formData.leaseDetails.leaseTerm} years</span></p>
                      <p>Condition: <span className="text-white capitalize">{formData.leaseDetails.condition.replace(/_/g, " ")}</span></p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-800 pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Back
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                className="bg-white text-slate-900 hover:bg-slate-200 w-full sm:w-auto"
              >
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-500 to-teal-400 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[200px]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </span>
                ) : (
                  "Generate AI Report"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
