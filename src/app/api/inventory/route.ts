import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/places";

type ItemInput = {
  name: string;
  unit: string;
  currentStock: number;
  parLevel: number;
  unitCost?: number | null;
  supplier?: string;
};

type ComputedItem = {
  name: string;
  unit: string;
  currentStock: number;
  parLevel: number;
  orderQty: number;
  status: "critical" | "low" | "ok";
  unitCost: number | null;
  lineOrderCost: number | null;
  supplier: string | null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeItem(item: ItemInput): ComputedItem {
  const orderQty = Math.max(item.parLevel - item.currentStock, 0);
  const status: "critical" | "low" | "ok" =
    item.currentStock <= item.parLevel * 0.25
      ? "critical"
      : item.currentStock < item.parLevel
        ? "low"
        : "ok";
  const unitCost = item.unitCost != null && item.unitCost > 0 ? item.unitCost : null;
  const lineOrderCost =
    unitCost !== null && orderQty > 0 ? round2(orderQty * unitCost) : null;

  return {
    name: item.name,
    unit: item.unit,
    currentStock: item.currentStock,
    parLevel: item.parLevel,
    orderQty,
    status,
    unitCost,
    lineOrderCost,
    supplier: item.supplier?.trim() || null,
  };
}

const SYSTEM_PROMPT = `You are an experienced restaurant inventory and purchasing manager. Given real stock data, provide actionable inventory advice.

Rules:
- Base all advice on the PROVIDED stock data; do not invent prices
- Par-level advice should consider that items repeatedly low may need higher pars
- Be specific about urgency and rationale
- For ordering schedule, suggest practical days (Mon/Wed/Fri etc.) with focus areas

Return valid JSON matching this schema exactly:
{
  "summary": "<string - 2-3 sentence overall assessment>",
  "urgentItems": [{"name": "<string>", "reason": "<string>"}],
  "parLevelAdvice": [{"item": "<string>", "suggestedPar": <number>, "rationale": "<string>"}],
  "orderingSchedule": [{"day": "<string>", "focus": "<string>", "note": "<string>"}],
  "wasteReductionTips": ["<string>"],
  "supplierTips": ["<string>"]
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cuisine, items } = body as { cuisine?: string; items: ItemInput[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one inventory item is required" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.name || typeof item.name !== "string" || !item.name.trim()) {
        return NextResponse.json({ error: "All items must have a name" }, { status: 400 });
      }
      if (typeof item.currentStock !== "number" || item.currentStock < 0) {
        return NextResponse.json(
          { error: `Invalid currentStock for "${item.name}" — must be a number >= 0` },
          { status: 400 }
        );
      }
      if (typeof item.parLevel !== "number" || item.parLevel < 0) {
        return NextResponse.json(
          { error: `Invalid parLevel for "${item.name}" — must be a number >= 0` },
          { status: 400 }
        );
      }
    }

    // Deterministic server computation
    const computedItems = items.map(computeItem);

    const itemsToOrder = computedItems.filter((i) => i.orderQty > 0).length;
    const lowStockCount = computedItems.filter((i) => i.status !== "ok").length;
    const criticalCount = computedItems.filter((i) => i.status === "critical").length;
    const costsWithValues = computedItems
      .map((i) => i.lineOrderCost)
      .filter((c): c is number => c !== null);
    const totalOrderCost = costsWithValues.length > 0
      ? round2(costsWithValues.reduce((a, b) => a + b, 0))
      : 0;

    const contextPayload = {
      cuisine: cuisine || null,
      itemCount: items.length,
      summary: {
        itemsToOrder,
        lowStockCount,
        criticalCount,
        totalOrderCost: costsWithValues.length > 0 ? totalOrderCost : null,
      },
      items: computedItems.map((i) => ({
        name: i.name,
        unit: i.unit,
        currentStock: i.currentStock,
        parLevel: i.parLevel,
        orderQty: i.orderQty,
        status: i.status,
        ...(i.unitCost !== null ? { unitCost: i.unitCost } : {}),
        ...(i.lineOrderCost !== null ? { lineOrderCost: i.lineOrderCost } : {}),
        ...(i.supplier ? { supplier: i.supplier } : {}),
      })),
    };

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Inventory data:\n${JSON.stringify(contextPayload, null, 2)}\n\nProvide inventory management advice based on this data.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Empty response from AI inventory analysis");
    }

    const modelJson = JSON.parse(result);

    return NextResponse.json({
      ...modelJson,
      computed: {
        items: computedItems,
        itemsToOrder,
        lowStockCount,
        criticalCount,
        totalOrderCost: costsWithValues.length > 0 ? totalOrderCost : null,
      },
      meta: {
        cuisine: cuisine || null,
        itemCount: items.length,
      },
    });
  } catch (error) {
    console.error("Inventory Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Inventory analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
