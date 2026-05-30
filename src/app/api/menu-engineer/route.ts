import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert menu engineer and restaurant profitability consultant. Given a complete menu with dish names, ingredients, costs, and prices, analyze profitability and provide actionable optimization advice.

CRITICAL RULES:
1. Calculate profit margin for each dish: margin = (price - cost) / price * 100
2. Flag dishes with margin below 65% as unprofitable
3. Recommend specific price adjustments (dollar amounts, not percentages)
4. Suggest menu layout positions based on profitability and psychology
5. Be specific about which dishes to feature, which to rework, and which to cut

Output valid JSON matching this schema exactly:
{
  "menuHealth": {
    "overallScore": <number 1-10>,
    "averageMargin": <number percentage>,
    "totalPotentialProfit": "<string e.g. '$4,200 per week at 100 covers/day'>",
    "summary": "<string - 2-3 sentence overall assessment>"
  },
  "dishAnalysis": [
    {
      "name": "<string - original dish name>",
      "currentMargin": <number percentage>,
      "suggestedPrice": <number>,
      "suggestedMargin": <number percentage>,
      "priceAdjustment": "<string e.g. '+$2.00' or 'Keep price'>",
      "verdict": "star" | "keep" | "adjust" | "cut",
      "reason": "<string - specific reason for this verdict>"
    }
  ],
  "stars": [
    {
      "name": "<string>",
      "reason": "<string - why this is a star dish>",
      "marketingTip": "<string - how to promote this dish>"
    }
  ],
  "unprofitable": [
    {
      "name": "<string>",
      "currentMargin": <number>,
      "reason": "<string - why this is unprofitable>",
      "solution": "<string - rework recipe, increase price, or cut>"
    }
  ],
  "layoutImprovements": [
    "<string - specific menu layout suggestion 1>",
    "<string - specific menu layout suggestion 2>",
    "<string - specific menu layout suggestion 3>"
  ],
  "categoryBreakdown": [
    {
      "category": "<string e.g. 'Appetizers', 'Mains', 'Desserts'>",
      "items": ["<dish name>", "<dish name>"],
      "averageMargin": <number>,
      "recommendation": "<string>"
    }
  ]
}`;

type DishInput = {
  name: string;
  ingredients: string;
  cost: number;
  price: number;
};

function calculateMargin(cost: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100 * 10) / 10;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dishes, restaurantName, cuisine } = body;

    if (!Array.isArray(dishes) || dishes.length === 0) {
      return NextResponse.json({ error: "At least one dish is required" }, { status: 400 });
    }

    for (const dish of dishes) {
      if (!dish.name || typeof dish.name !== "string" || !dish.name.trim()) {
        return NextResponse.json({ error: "All dishes must have a name" }, { status: 400 });
      }
      if (typeof dish.cost !== "number" || dish.cost < 0) {
        return NextResponse.json({ error: `Invalid cost for "${dish.name}"` }, { status: 400 });
      }
      if (typeof dish.price !== "number" || dish.price <= 0) {
        return NextResponse.json({ error: `Invalid price for "${dish.name}"` }, { status: 400 });
      }
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey || openAIKey === "your_openai_api_key_here") {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    const menuData = dishes.map((d: DishInput) => ({
      name: d.name.trim(),
      ingredients: d.ingredients || "Not specified",
      costToMake: d.cost,
      sellingPrice: d.price,
      profitMargin: `${calculateMargin(d.cost, d.price)}%`,
    }));

    const totalCost = dishes.reduce((s: number, d: DishInput) => s + d.cost, 0);
    const totalRevenue = dishes.reduce((s: number, d: DishInput) => s + d.price, 0);
    const avgMargin = dishes.reduce((s: number, d: DishInput) => s + calculateMargin(d.cost, d.price), 0) / dishes.length;

    const context = `Menu Analysis Request:
${restaurantName ? `- Restaurant: ${restaurantName}` : ""}
${cuisine ? `- Cuisine: ${cuisine}` : ""}
- Total Dishes: ${dishes.length}
- Average Margin: ${avgMargin.toFixed(1)}%
- Total Food Cost: $${totalCost.toFixed(2)}
- Total Menu Revenue: $${totalRevenue.toFixed(2)}

Menu Items:
${JSON.stringify(menuData, null, 2)}

Analyze each dish's profitability and provide optimization recommendations.`;

    const openai = new OpenAI({ apiKey: openAIKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Empty response from AI menu analysis");
    }

    const analysis = JSON.parse(result);
    return NextResponse.json({
      ...analysis,
      meta: {
        restaurantName: restaurantName || null,
        cuisine: cuisine || null,
        dishCount: dishes.length,
        averageMargin: Math.round(avgMargin * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Menu Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Menu analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
