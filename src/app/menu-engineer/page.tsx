"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Utensils, Plus, Trash2, AlertCircle, Calculator, TrendingUp, TrendingDown } from "lucide-react";

type DishRow = {
  id: number;
  name: string;
  ingredients: string;
  cost: string;
  price: string;
};

const LOADING_MESSAGES = [
  "Analyzing your menu...",
  "Calculating profit margins...",
  "Identifying stars & cuts...",
  "Optimizing menu layout...",
];

function calcMargin(cost: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100 * 10) / 10;
}

let nextId = 1;

function createEmptyRow(): DishRow {
  return { id: nextId++, name: "", ingredients: "", cost: "", price: "" };
}

export default function MenuEngineerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [dishes, setDishes] = useState<DishRow[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);

  const updateDish = useCallback((id: number, field: keyof DishRow, value: string) => {
    setDishes((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.dishes;
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setDishes((prev) => [...prev, createEmptyRow()]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setDishes((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  const stats = dishes.reduce(
    (acc, d) => {
      const c = parseFloat(d.cost) || 0;
      const p = parseFloat(d.price) || 0;
      if (c > 0 || p > 0) {
        acc.totalCost += c;
        acc.totalPrice += p;
        acc.count++;
        if (p > 0) acc.avgMargin += calcMargin(c, p);
      }
      return acc;
    },
    { totalCost: 0, totalPrice: 0, count: 0, avgMargin: 0 }
  );
  if (stats.count > 0) stats.avgMargin = Math.round((stats.avgMargin / stats.count) * 10) / 10;

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const validDishes = dishes.filter((d) => d.name.trim() || d.cost || d.price);
    if (validDishes.length === 0) {
      newErrors.dishes = "Add at least one dish with a name, cost, and price";
      setErrors(newErrors);
      return false;
    }
    for (let i = 0; i < validDishes.length; i++) {
      const d = validDishes[i];
      if (!d.name.trim()) {
        newErrors.dishes = `Dish #${i + 1} needs a name`;
        break;
      }
      if (!d.cost || parseFloat(d.cost) < 0) {
        newErrors.dishes = `"${d.name}" needs a valid cost`;
        break;
      }
      if (!d.price || parseFloat(d.price) <= 0) {
        newErrors.dishes = `"${d.name}" needs a valid selling price`;
        break;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [dishes]);

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
      const validDishes = dishes
        .filter((d) => d.name.trim() && d.cost && d.price)
        .map((d) => ({
          name: d.name.trim(),
          ingredients: d.ingredients.trim() || "Not specified",
          cost: parseFloat(d.cost),
          price: parseFloat(d.price),
        }));

      const response = await fetch("/api/menu-engineer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishes: validDishes,
          restaurantName: restaurantName.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
        }),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Menu analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`menu_engineer_report_${reportId}`, JSON.stringify(data));
      router.push(`/menu-engineer-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message = error instanceof Error ? error.message : "Menu analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [dishes, restaurantName, cuisine, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-10 text-sm";
  const cellClass = "bg-slate-950 border-slate-800 text-white text-sm h-9 px-2 w-full focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-orange-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-4xl z-10">
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
              <Utensils className="text-orange-400" /> Menu Engineer
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your menu items with costs and prices. The AI will analyze profitability and suggest optimizations.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Optional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restName" className="text-slate-300 text-sm">Restaurant Name <span className="text-slate-500 font-normal">(optional)</span></Label>
                <Input
                  id="restName"
                  placeholder="e.g. Bella Cucina"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisineType" className="text-slate-300 text-sm">Cuisine <span className="text-slate-500 font-normal">(optional)</span></Label>
                <Input
                  id="cuisineType"
                  placeholder="e.g. Italian"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Menu Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">
                  Menu Items <span className="text-rose-400">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addRow}
                  disabled={isLoading}
                  className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-8"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Dish
                </Button>
              </div>

              {errors.dishes && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.dishes}
                </p>
              )}

              {/* Table Header */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 px-2 text-slate-500 font-medium w-[25%]">Dish Name</th>
                      <th className="text-left py-2 px-2 text-slate-500 font-medium w-[30%]">Key Ingredients</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[15%]">Cost ($)</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[15%]">Price ($)</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[12%]">Margin</th>
                      <th className="w-[3%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dishes.map((dish) => {
                      const cost = parseFloat(dish.cost) || 0;
                      const price = parseFloat(dish.price) || 0;
                      const margin = price > 0 ? calcMargin(cost, price) : 0;
                      const marginColor =
                        margin >= 70 ? "text-emerald-400" :
                        margin >= 55 ? "text-amber-400" :
                        price > 0 ? "text-rose-400" : "text-slate-600";

                      return (
                        <tr key={dish.id} className="border-b border-slate-800/50">
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={dish.name}
                              onChange={(e) => updateDish(dish.id, "name", e.target.value)}
                              placeholder="e.g. Margherita Pizza"
                              className={cellClass}
                              disabled={isLoading}
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={dish.ingredients}
                              onChange={(e) => updateDish(dish.id, "ingredients", e.target.value)}
                              placeholder="e.g. Mozzarella, tomato, basil"
                              className={cellClass}
                              disabled={isLoading}
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              value={dish.cost}
                              onChange={(e) => updateDish(dish.id, "cost", e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className={`${cellClass} text-right`}
                              disabled={isLoading}
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              value={dish.price}
                              onChange={(e) => updateDish(dish.id, "price", e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className={`${cellClass} text-right`}
                              disabled={isLoading}
                            />
                          </td>
                          <td className="py-1 px-2 text-right">
                            <span className={`text-sm font-mono font-medium ${marginColor}`}>
                              {price > 0 ? `${margin}%` : "—"}
                            </span>
                          </td>
                          <td className="py-1 px-1">
                            <button
                              type="button"
                              onClick={() => removeRow(dish.id)}
                              disabled={isLoading || dishes.length <= 1}
                              className="text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-30 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Bar */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  {stats.count} dishes
                </span>
                <span>
                  Total cost: <span className="text-white font-medium">${stats.totalCost.toFixed(2)}</span>
                </span>
                <span>
                  Total revenue: <span className="text-white font-medium">${stats.totalPrice.toFixed(2)}</span>
                </span>
                <span className="flex items-center gap-1">
                  Avg margin:
                  <span className={`font-medium ${stats.avgMargin >= 65 ? "text-emerald-400" : stats.avgMargin >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                    {stats.count > 0 ? `${stats.avgMargin}%` : "—"}
                  </span>
                  {stats.count > 0 && (
                    stats.avgMargin >= 65
                      ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                      : <TrendingDown className="w-3 h-3 text-rose-400" />
                  )}
                </span>
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
              className="bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[200px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> Analyze Menu
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
