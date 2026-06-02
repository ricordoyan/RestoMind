import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/places";
import type { DishStat, OrderTotals } from "@/lib/store";

const SYSTEM_PROMPT = `You are an expert restaurant menu engineer with deep knowledge of menu profitability analysis. You will receive per-dish sales data (units sold, revenue, profit margin %) along with overall order totals.

Your task: classify each dish into the classic menu-engineering matrix using TWO dimensions:
- POPULARITY: based on units sold relative to the average/median units across all dishes
- PROFITABILITY: based on profit margin %, with ~65% as the benchmark for food service

Classification rules:
- STAR = high popularity + high margin (≥65%): promote, feature prominently, protect recipe
- PLOWHORSE = high popularity + low margin (<65%): find ways to reduce cost or gently raise price
- PUZZLE = low popularity + high margin (≥65%): reposition, rename, or bundle to drive volume
- DOG = low popularity + low margin (<65%): consider removing or completely reworking

IMPORTANT: If a dish has hasCost=false (no cost data in the system), its margin is unknown. Classify it by popularity only and explicitly note "margin unknown – no cost data" in the reason. Do not make up a margin.

Base every insight ONLY on the numbers provided. Give concrete, specific, actionable recommendations referencing actual dish names and their statistics.

Return ONLY valid JSON in exactly this shape (no markdown fences, no extra keys):
{
  "summary": "<2-3 sentence overview of the menu's performance>",
  "classification": [
    {
      "name": "<dish name>",
      "category": "star" | "plowhorse" | "puzzle" | "dog",
      "reason": "<why, citing its actual units sold and margin %>"
    }
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>"
  ],
  "pricingActions": [
    {
      "name": "<dish name>",
      "action": "<e.g. Raise price by ~$1.50>",
      "detail": "<why this change makes sense given the data>"
    }
  ],
  "topOpportunities": [
    "<highest-impact opportunity string 1>",
    "<highest-impact opportunity string 2>"
  ]
}`;

type RequestBody = {
  stats: DishStat[];
  totals: OrderTotals;
  period?: string;
};

// Exported so the page can use it for typing the AI response
export type InsightsResponse = {
  summary: string;
  classification: {
    name: string;
    category: "star" | "plowhorse" | "puzzle" | "dog";
    reason: string;
  }[];
  recommendations: string[];
  pricingActions: {
    name: string;
    action: string;
    detail: string;
  }[];
  topOpportunities: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const { stats, totals, period } = body;

    if (!Array.isArray(stats) || stats.length === 0) {
      return NextResponse.json(
        { error: "stats must be a non-empty array of dish statistics" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    const sorted = [...stats].sort((a, b) => a.units - b.units);
    const mid = Math.floor(sorted.length / 2);
    const medianUnits =
      sorted.length % 2 !== 0
        ? sorted[mid].units
        : Math.round((sorted[mid - 1].units + sorted[mid].units) / 2);

    const userMessage = `Analyze the following menu sales data${period ? ` for the period: ${period}` : ""}.

OVERALL TOTALS:
${JSON.stringify(totals, null, 2)}

PER-DISH STATISTICS (sorted by units sold, descending):
${JSON.stringify(stats, null, 2)}

Notes:
- Dishes with hasCost=false have no food cost entered in the system; margin is unknown for those.
- marginPct is already computed as (profit / revenue) * 100 for dishes that have cost data.
- Popularity threshold (median units sold): ${medianUnits} units.

Classify every dish and provide actionable insights.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty response from AI");
    }

    const parsed = JSON.parse(raw) as InsightsResponse;
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Menu Insights API Error:", error);
    const message =
      error instanceof Error ? error.message : "Menu insights analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
