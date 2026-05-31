import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/places";

const SYSTEM_PROMPT = `You are an expert chef and food-cost consultant. You will be given computed financial figures for a recipe — do NOT re-calculate or invent numbers. Base all advice strictly on the provided computed values.

Return valid JSON matching this schema exactly:
{
  "verdict": "healthy" | "watch" | "high_cost",
  "assessment": "<string - 2-3 sentence overall assessment of this dish's food cost position>",
  "costReduction": [
    { "ingredient": "<string>", "suggestion": "<string>", "estimatedSaving": "<string e.g. '$0.40/serving'>" }
  ],
  "expensiveIngredients": [
    { "name": "<string>", "note": "<string - why it's costly and any alternatives>" }
  ],
  "pricingAdvice": {
    "recommendedPrice": <number - realistic price for the cuisine achieving ~28-35% food cost>,
    "rationale": "<string>"
  },
  "portioningTips": ["<string>", "<string>"],
  "supplierTips": ["<string>", "<string>"]
}`;

type IngredientInput = {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      dishName,
      sellingPrice,
      servings,
      targetFoodCostPct,
      ingredients,
      cuisine,
    } = body as {
      dishName: string;
      sellingPrice: number;
      servings?: number;
      targetFoodCostPct?: number;
      ingredients: IngredientInput[];
      cuisine?: string;
    };

    // Validation
    if (!dishName || typeof dishName !== "string" || !dishName.trim()) {
      return NextResponse.json({ error: "Dish name is required" }, { status: 400 });
    }
    if (typeof sellingPrice !== "number" || sellingPrice <= 0) {
      return NextResponse.json(
        { error: "Selling price must be a positive number" },
        { status: 400 }
      );
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient is required" },
        { status: 400 }
      );
    }
    for (const ing of ingredients) {
      if (!ing.name || typeof ing.name !== "string" || !ing.name.trim()) {
        return NextResponse.json(
          { error: "Each ingredient must have a name" },
          { status: 400 }
        );
      }
      if (typeof ing.cost !== "number" || ing.cost < 0) {
        return NextResponse.json(
          { error: `Ingredient "${ing.name}" has an invalid cost` },
          { status: 400 }
        );
      }
    }

    // Deterministic server-side calculations
    const srv = servings && servings > 0 ? servings : 1;
    const target = targetFoodCostPct && targetFoodCostPct > 0 ? targetFoodCostPct : 30;

    const totalCost = round2(ingredients.reduce((s, i) => s + i.cost, 0));
    const costPerServing = round2(totalCost / srv);
    const foodCostPercent = sellingPrice > 0 ? round1((costPerServing / sellingPrice) * 100) : 0;
    const grossProfitPerServing = round2(sellingPrice - costPerServing);
    const marginPercent = round1((grossProfitPerServing / sellingPrice) * 100);
    const priceForTargetFoodCost = round2(costPerServing / (target / 100));

    const enrichedIngredients = ingredients.map((ing) => ({
      name: ing.name.trim(),
      quantity: ing.quantity,
      unit: ing.unit,
      cost: ing.cost,
      share: totalCost > 0 ? round1((ing.cost / totalCost) * 100) : 0,
    }));

    const openai = getOpenAIClient();

    const userContent = `Dish: ${dishName.trim()}${cuisine ? ` (${cuisine})` : ""}

Computed financials (do not recalculate):
- Total ingredient cost: $${totalCost}
- Servings: ${srv}
- Cost per serving: $${costPerServing}
- Selling price: $${sellingPrice}
- Food cost %: ${foodCostPercent}%
- Gross profit per serving: $${grossProfitPerServing}
- Margin %: ${marginPercent}%
- Target food cost %: ${target}%
- Price needed for target food cost: $${priceForTargetFoodCost}

Ingredient breakdown (sorted by cost share):
${enrichedIngredients
  .slice()
  .sort((a, b) => b.share - a.share)
  .map((i) => `- ${i.name}: ${i.quantity} ${i.unit}, $${i.cost} (${i.share}% of total)`)
  .join("\n")}

Provide verdict, assessment, cost-reduction suggestions, expensive ingredient notes, pricing advice, portioning tips, and supplier tips.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from AI food-cost analysis");

    const modelJson = JSON.parse(raw);

    return NextResponse.json({
      ...modelJson,
      computed: {
        totalCost,
        costPerServing,
        foodCostPercent,
        grossProfitPerServing,
        marginPercent,
        sellingPrice,
        servings: srv,
        targetFoodCostPct: target,
        priceForTargetFoodCost,
        ingredients: enrichedIngredients,
      },
      meta: {
        dishName: dishName.trim(),
        cuisine: cuisine || null,
      },
    });
  } catch (error) {
    console.error("Recipe Cost Analysis Error:", error);
    const message =
      error instanceof Error ? error.message : "Recipe cost analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
