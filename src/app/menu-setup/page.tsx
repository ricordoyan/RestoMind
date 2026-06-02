"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2, UtensilsCrossed } from "lucide-react";
import { getMenu, saveMenu, newId, type MenuItem } from "@/lib/store";

type Row = { id: string; name: string; price: string; cost: string; category: string };

const blankRow = (): Row => ({ id: newId(), name: "", price: "", cost: "", category: "" });

export default function MenuSetupPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const menu = getMenu();
    if (menu.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
      setRows(
        menu.map((m) => ({
          id: m.id,
          name: m.name,
          price: String(m.price),
          cost: String(m.cost),
          category: m.category ?? "",
        }))
      );
    }
  }, []);

  const update = (id: string, field: keyof Row, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const addRow = () => setRows((prev) => [...prev, blankRow()]);
  const removeRow = (id: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const save = () => {
    const items: MenuItem[] = rows
      .filter((r) => r.name.trim() && Number(r.price) > 0)
      .map((r) => ({
        id: r.id,
        name: r.name.trim(),
        price: Number(r.price),
        cost: Number(r.cost) || 0,
        category: r.category.trim() || undefined,
      }));
    saveMenu(items);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const margin = (price: string, cost: string) => {
    const p = Number(price);
    const c = Number(cost);
    if (!(p > 0)) return null;
    return Math.round(((p - c) / p) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="text-slate-400 hover:text-white mb-4" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UtensilsCrossed className="text-indigo-400 w-5 h-5" /> Your Menu
            </CardTitle>
            <CardDescription>
              Define each dish with its sell price and food cost. The phone agent uses this to take
              orders, and menu engineering uses it to compute profit margins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-slate-500 px-1">
              <span className="col-span-4">Dish</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-2">Price ($)</span>
              <span className="col-span-2">Cost ($)</span>
              <span className="col-span-1 text-center">Margin</span>
              <span className="col-span-1" />
            </div>

            {rows.map((r) => {
              const m = margin(r.price, r.cost);
              return (
                <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-12 sm:col-span-4 bg-slate-950 border-slate-700 text-white h-10"
                    placeholder="Margherita Pizza"
                    value={r.name}
                    onChange={(e) => update(r.id, "name", e.target.value)}
                  />
                  <Input
                    className="col-span-6 sm:col-span-2 bg-slate-950 border-slate-700 text-white h-10"
                    placeholder="Pizza"
                    value={r.category}
                    onChange={(e) => update(r.id, "category", e.target.value)}
                  />
                  <Input
                    className="col-span-3 sm:col-span-2 bg-slate-950 border-slate-700 text-white h-10"
                    placeholder="14.00"
                    type="number"
                    value={r.price}
                    onChange={(e) => update(r.id, "price", e.target.value)}
                  />
                  <Input
                    className="col-span-3 sm:col-span-2 bg-slate-950 border-slate-700 text-white h-10"
                    placeholder="4.50"
                    type="number"
                    value={r.cost}
                    onChange={(e) => update(r.id, "cost", e.target.value)}
                  />
                  <span
                    className={`col-span-9 sm:col-span-1 text-center text-sm font-semibold ${
                      m == null ? "text-slate-600" : m >= 65 ? "text-emerald-400" : m >= 50 ? "text-amber-400" : "text-rose-400"
                    }`}
                  >
                    {m == null ? "—" : `${m}%`}
                  </span>
                  <button
                    className="col-span-3 sm:col-span-1 flex justify-center text-slate-500 hover:text-rose-400"
                    onClick={() => removeRow(r.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" onClick={addRow} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                <Plus className="mr-2 w-4 h-4" /> Add dish
              </Button>
              <Button onClick={save} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                {saved ? <CheckCircle2 className="mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
                {saved ? "Saved" : "Save menu"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800 mt-2">
              <Button variant="ghost" className="text-teal-300 hover:text-teal-200" onClick={() => router.push("/phone-agent")}>
                Go to Phone Agent →
              </Button>
              <Button variant="ghost" className="text-emerald-300 hover:text-emerald-200" onClick={() => router.push("/insights")}>
                Go to Menu Insights →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
