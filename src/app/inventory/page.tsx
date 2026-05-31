"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Package,
  Plus,
  Trash2,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";

type ItemRow = {
  id: number;
  name: string;
  unit: string;
  currentStock: string;
  parLevel: string;
  unitCost: string;
  supplier: string;
};

const UNIT_OPTIONS = ["kg", "g", "L", "ml", "each", "case", "box", "bottle", "pack"];

const LOADING_MESSAGES = [
  "Checking stock levels...",
  "Calculating order quantities...",
  "Flagging low stock...",
  "Optimizing par levels...",
];

let nextId = 1;

function createEmptyRow(): ItemRow {
  return {
    id: nextId++,
    name: "",
    unit: "each",
    currentStock: "",
    parLevel: "",
    unitCost: "",
    supplier: "",
  };
}

export default function InventoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [cuisine, setCuisine] = useState("");

  const [items, setItems] = useState<ItemRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  const updateItem = useCallback((id: number, field: keyof ItemRow, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.items;
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setItems((prev) => [...prev, createEmptyRow()]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const filledItems = items.filter((i) => i.name.trim() || i.currentStock || i.parLevel);

    if (filledItems.length === 0) {
      newErrors.items = "Add at least one item with a name, current stock, and par level";
      setErrors(newErrors);
      return false;
    }

    for (let i = 0; i < filledItems.length; i++) {
      const item = filledItems[i];
      if (!item.name.trim()) {
        newErrors.items = `Item #${i + 1} needs a name`;
        break;
      }
      const stock = parseFloat(item.currentStock);
      if (item.currentStock === "" || isNaN(stock) || stock < 0) {
        newErrors.items = `"${item.name}" needs a valid current stock (>= 0)`;
        break;
      }
      const par = parseFloat(item.parLevel);
      if (item.parLevel === "" || isNaN(par) || par < 0) {
        newErrors.items = `"${item.name}" needs a valid par level (>= 0)`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [items]);

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
      const validItems = items
        .filter((i) => i.name.trim() && i.currentStock !== "" && i.parLevel !== "")
        .map((i) => ({
          name: i.name.trim(),
          unit: i.unit,
          currentStock: parseFloat(i.currentStock),
          parLevel: parseFloat(i.parLevel),
          unitCost: i.unitCost ? parseFloat(i.unitCost) : null,
          supplier: i.supplier.trim() || undefined,
        }));

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuisine: cuisine.trim() || undefined,
          items: validItems,
        }),
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Inventory analysis failed (${response.status})`);
      }

      const data = await response.json();
      localStorage.setItem(`inventory_report_${reportId}`, JSON.stringify(data));
      router.push(`/inventory-report/${reportId}`);
    } catch (error) {
      clearInterval(messageInterval);
      const message =
        error instanceof Error ? error.message : "Inventory analysis failed. Please try again.";
      setApiError(message);
      setIsLoading(false);
    }
  }, [items, cuisine, validate, router]);

  const inputClass = "bg-slate-950 border-slate-700 text-white h-10 text-sm";
  const cellClass =
    "bg-slate-950 border border-slate-800 text-white text-sm h-9 px-2 w-full focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none rounded";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 sm:py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-sky-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-5xl z-10">
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
              <Package className="text-sky-400" /> Inventory &amp; Ordering
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your current stock and par levels. The AI will flag low stock, compute order
              quantities, and suggest par-level and waste-reduction improvements.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Cuisine */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine" className="text-slate-300 text-sm">
                  Cuisine <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="cuisine"
                  placeholder="e.g. Italian, Mexican, American"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Inventory Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">
                  Inventory Items <span className="text-rose-400">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addRow}
                  disabled={isLoading}
                  className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 h-8"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>

              {errors.items && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.items}
                </p>
              )}

              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 px-2 text-slate-500 font-medium w-[22%]">
                        Item Name
                      </th>
                      <th className="text-left py-2 px-2 text-slate-500 font-medium w-[10%]">
                        Unit
                      </th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[12%]">
                        Stock
                      </th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[12%]">
                        Par Level
                      </th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium w-[14%]">
                        $ per Unit
                      </th>
                      <th className="text-left py-2 px-2 text-slate-500 font-medium w-[22%]">
                        Supplier
                      </th>
                      <th className="w-[4%]" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800/50">
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                            placeholder="e.g. Chicken Breast"
                            className={cellClass}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <Select
                            value={item.unit}
                            onValueChange={(val) => updateItem(item.id, "unit", val ?? "")}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-9 text-sm focus:ring-sky-500 focus:border-sky-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                              {UNIT_OPTIONS.map((u) => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            value={item.currentStock}
                            onChange={(e) => updateItem(item.id, "currentStock", e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.1"
                            className={`${cellClass} text-right`}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            value={item.parLevel}
                            onChange={(e) => updateItem(item.id, "parLevel", e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.1"
                            className={`${cellClass} text-right`}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.id, "unitCost", e.target.value)}
                            placeholder="—"
                            min="0"
                            step="0.01"
                            className={`${cellClass} text-right`}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={item.supplier}
                            onChange={(e) => updateItem(item.id, "supplier", e.target.value)}
                            placeholder="e.g. US Foods"
                            className={cellClass}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="py-1 px-1">
                          <button
                            type="button"
                            onClick={() => removeRow(item.id)}
                            disabled={isLoading || items.length <= 1}
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

              <p className="text-xs text-slate-500 pt-1">
                Par level is the minimum stock quantity you want on hand before reordering. Unit
                cost and supplier are optional but improve order cost estimates.
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
              className="bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:opacity-90 font-medium border-0 w-full sm:w-auto min-w-[220px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Analyze Inventory
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
