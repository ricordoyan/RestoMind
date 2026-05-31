"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Calculator,
  ChefHat,
  DollarSign,
} from "lucide-react";

const UNIT_OPTIONS = ["g", "kg", "ml", "L", "each", "oz", "lb", "cup", "tbsp", "tsp"];

const LOADING_MESSAGES = [
  "Tallying ingredient costs...",
  "Calculating margins...",
  "Finding savings...",
  "Pricing the dish...",
];

type IngredientRow = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
  cost: string;
};

let nextId = 1;

function createEmptyIngredient(): IngredientRow {
  return { id: nextId++, name: "", quantity: "", unit: "g", cost: "" };
}

export default function RecipeCostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [dishName, setDishName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [servings, setServings] = useState("");
  const [targetFoodCostPct, setTargetFoodCostPct] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    createEmptyIngredient(),
    createEmptyIngredient(),
    createEmptyIngredient(),
  ]);

  const updateIngredient = useCallback(
    (id: number, field: keyof IngredientRow, value: string) => {
      setIngredients((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
      setErrors((prev) => {
        const next = { ...prev };
        delete next.ingredients;
        return next;
      });
    },
    []
  );

  const addRow = useCallback(() => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setIngredients((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  // Live totals
  const liveTotal = ingredients.reduce((sum, r) => {
    const c = parseFloat(r.cost);
    return sum + (isNaN(c) ? 0 : c);
  }, 0);
  const liveSrv = parseFloat(servings) > 0 ? parseFloat(servings) : 1;
  const liveCostPerServing = liveTotal / liveSrv;
  const livePrice = parseFloat(sellingPrice);
  const liveFoodCostPct =
    livePrice > 0 ? Math.round((liveCostPerServing / livePrice) * 1000) / 10 : null;

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!dishName.trim()) newErrors.dishName = "Dish name is required";
    const sp = parseFloat(sellingPrice);
    if (!sellingPrice || isNaN(sp) || sp <= 0)
      newErrors.sellingPrice = "Selling price must be a positive number";
    const validIngredients = ingredients.filter((r) => r.name.trim() || r.cost);
    if (validIngredients.length === 0) {
      newErrors.ingredients = "Add at least one ingredient with a name and cost";
    } else {
      for (let i = 0; i < validIngredients.length; i++) {
        const r = validIngredients[i];
        if (!r.name.trim()) {
          newErrors.ingredients = `Ingredient #${i + 1} needs a name`;
          break;
        }
        const c = parseFloat(r.cost);
        if (r.cost === "" || isNaN(c) || c < 0) {
          newErrors.ingredients = `"${r.name || `Ingredient #${i + 1}`}" needs a valid cost (≥ 0)`;
          break;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [dishName, sellingPrice, ingredients]);

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
      const validIngredients = ingredients
        .filter((r) => r.name.trim() && r.cost !== "")
        .map((r) => ({
          name: r.name.trim(),
          quantity: parseFloat(r.quantity) || 0,
          unit: r.unit,
          cost: parseFloat(r.cost),
        }));

      const body: Record<string, unknown> = {
        dishName: dishName.trim(),
        sellingPrice: parseFloat(sellingPrice),
        ingredients: validIngredients,
      };
      if (cuisine.trim()) body.cuisine = cuisine.trim();
      const srv = parseFloat(servings);
      if (!isNaN(srv) && srv > 0) body.servings = srv;
      const tfc = parseFloat(targetFoodCostPct);
      if (!isNaN(tfc) && tfc > 0) body.targetFoodCostPct = tfc;

      const response = await fetch("/api/recipe-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Recipe cost analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`recipe_cost_report_${reportId}`, JSON.stringify(data));
      router.push(`/recipe-cost-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message =
        error instanceof Error ? error.message : "Recipe cost analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [dishName, cuisine, sellingPrice, servings, targetFoodCostPct, ingredients, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-10 text-sm";
  const errorClass = "border-rose-500 focus-visible:ring-rose-500";
  const cellClass =
    "bg-slate-950 border border-slate-800 text-white text-sm h-9 px-2 w-full focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none rounded";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-lime-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-4xl z-10">
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
              <ChefHat className="text-lime-400" /> Recipe &amp; Food Cost Builder
            </CardTitle>
            <CardDescription className="text-slate-400">
              Build your recipe from ingredients, set a selling price, and instantly see your food
              cost %, margin, and AI-powered pricing and cost-reduction advice — just like a
              professional kitchen consultant.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dish basics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dishName" className="text-slate-300 text-sm">
                  Dish Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="dishName"
                  placeholder="e.g. Pan-Seared Salmon"
                  value={dishName}
                  onChange={(e) => {
                    setDishName(e.target.value);
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.dishName;
                      return n;
                    });
                  }}
                  className={`${inputClass} ${errors.dishName ? errorClass : ""}`}
                  disabled={isLoading}
                />
                {errors.dishName && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.dishName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisine" className="text-slate-300 text-sm">
                  Cuisine <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="cuisine"
                  placeholder="e.g. French, Italian, Asian Fusion"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Pricing & servings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellingPrice" className="text-slate-300 text-sm">
                  Selling Price ($) <span className="text-rose-400">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <Input
                    id="sellingPrice"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => {
                      setSellingPrice(e.target.value);
                      setErrors((p) => {
                        const n = { ...p };
                        delete n.sellingPrice;
                        return n;
                      });
                    }}
                    className={`${inputClass} pl-9 ${errors.sellingPrice ? errorClass : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.sellingPrice && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.sellingPrice}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings" className="text-slate-300 text-sm">
                  Servings <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="servings"
                  type="number"
                  placeholder="1"
                  step="1"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetFoodCostPct" className="text-slate-300 text-sm">
                  Target Food Cost % <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="targetFoodCostPct"
                  type="number"
                  placeholder="30"
                  step="1"
                  min="1"
                  max="100"
                  value={targetFoodCostPct}
                  onChange={(e) => setTargetFoodCostPct(e.target.value)}
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Ingredients table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">
                  Ingredients <span className="text-rose-400">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addRow}
                  disabled={isLoading}
                  className="text-lime-400 hover:text-lime-300 hover:bg-lime-500/10 h-8"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Ingredient
                </Button>
              </div>

              {errors.ingredients && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.ingredients}
                </p>
              )}

              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 px-2 text-slate-500 font-medium w-[35%]">
                        Ingredient Name
                      </th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[15%]">
                        Qty
                      </th>
                      <th className="text-left py-2 px-2 text-slate-500 font-medium w-[18%]">
                        Unit
                      </th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[20%]">
                        $ Cost used
                      </th>
                      <th className="w-[5%]" />
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((row) => (
                      <tr key={row.id} className="border-b border-slate-800/50">
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => updateIngredient(row.id, "name", e.target.value)}
                            placeholder="e.g. Salmon fillet"
                            className={cellClass}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => updateIngredient(row.id, "quantity", e.target.value)}
                            placeholder="0"
                            step="any"
                            min="0"
                            className={`${cellClass} text-right`}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <select
                            value={row.unit}
                            onChange={(e) => updateIngredient(row.id, "unit", e.target.value)}
                            disabled={isLoading}
                            className="bg-slate-950 border border-slate-800 text-white text-sm h-9 px-2 w-full focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none rounded"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            value={row.cost}
                            onChange={(e) => updateIngredient(row.id, "cost", e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className={`${cellClass} text-right`}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={isLoading || ingredients.length <= 1}
                            className="text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-30 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Live summary bar */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  {ingredients.filter((r) => r.name.trim()).length} ingredients
                </span>
                <span>
                  Total cost:{" "}
                  <span className="text-white font-medium">${liveTotal.toFixed(2)}</span>
                </span>
                <span>
                  Cost/serving:{" "}
                  <span className="text-white font-medium">
                    ${liveCostPerServing.toFixed(2)}
                  </span>
                </span>
                {liveFoodCostPct !== null && (
                  <span>
                    Food cost:{" "}
                    <span
                      className={`font-medium ${
                        liveFoodCostPct <= 35
                          ? "text-emerald-400"
                          : liveFoodCostPct <= 45
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {liveFoodCostPct}%
                    </span>
                  </span>
                )}
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
              className="bg-gradient-to-r from-lime-500 to-green-500 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[220px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" /> Analyze Food Cost
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
