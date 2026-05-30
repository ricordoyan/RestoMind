import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert restaurant procurement consultant and kitchen designer. Given details about a restaurant concept, generate a complete equipment and smallwares procurement checklist.

CRITICAL RULES:
1. Provide realistic estimated prices based on current US market rates for commercial kitchen equipment.
2. Used prices should be 40-60% of new prices but must reflect real market conditions.
3. Group items into logical categories: Cooking Equipment, Prep & Mixing, Refrigeration & Storage, Serving & Holding, Smallwares & Utensils, Furniture & Front-of-House, Safety & Sanitation.
4. Mark each item as "essential" (must-have for opening) or "recommended" (nice-to-have or phased).
5. Scam avoidance tips must be specific and actionable.
6. Include search terms for each item that would work on eBay and Facebook Marketplace.

Output valid JSON matching this schema exactly:
{
  "equipmentByCategory": [
    {
      "category": "<string>",
      "icon": "<string - one of: cooking, prep, refrigeration, serving, smallwares, furniture, safety>",
      "items": [
        {
          "name": "<string>",
          "essential": true,
          "estimatedNewPrice": "<string e.g. '$2,000 - $4,000'>",
          "estimatedUsedPrice": "<string e.g. '$800 - $2,000'>",
          "notes": "<string with buying advice>",
          "searchTerms": ["<string search term for marketplace>", "<string alternative term>"]
        }
      ]
    }
  ],
  "totalEstimatedNew": "<string e.g. '$45,000 - $65,000'>",
  "totalEstimatedUsed": "<string e.g. '$22,000 - $38,000'>",
  "scamTips": [
    "<string - specific scam avoidance tip 1>",
    "<string - specific scam avoidance tip 2>",
    "<string - specific scam avoidance tip 3>",
    "<string - specific scam avoidance tip 4>"
  ]
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cuisine, squareFootage, location, budget, notes } = body;

    if (!cuisine || typeof cuisine !== "string") {
      return NextResponse.json({ error: "Cuisine type is required" }, { status: 400 });
    }
    if (!squareFootage || squareFootage <= 0) {
      return NextResponse.json({ error: "Square footage is required and must be positive" }, { status: 400 });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey || openAIKey === "your_openai_api_key_here") {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    const context = `Restaurant Concept Details:
- Cuisine: ${cuisine}
- Kitchen Square Footage: ${squareFootage} sq ft
${location ? `- Location: ${location}` : ""}
${budget ? `- Equipment Budget: $${budget}` : "- Equipment Budget: Not specified"}
${notes ? `- Additional Notes: ${notes}` : ""}

Generate a comprehensive procurement checklist tailored to this ${cuisine} restaurant. Include specialized equipment needed for this cuisine type.`;

    const openai = new OpenAI({ apiKey: openAIKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 2500,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Empty response from AI procurement analysis");
    }

    const procurementPlan = JSON.parse(result);

    const encodedLocation = location ? encodeURIComponent(location) : "";
    const encodedCuisine = encodeURIComponent(cuisine);

    const marketplaceLinks = [
      {
        platform: "eBay",
        url: `https://www.ebay.com/sch/i.html?_nkw=commercial+restaurant+equipment+${encodedCuisine}&_sacat=11772`,
        label: "Search eBay for restaurant equipment",
      },
      {
        platform: "Facebook Marketplace",
        url: `https://www.facebook.com/marketplace/search/?query=${encodedCuisine}+restaurant+kitchen+equipment${encodedLocation ? `&location=${encodedLocation}` : ""}`,
        label: "Search Facebook Marketplace for used equipment",
      },
      {
        platform: "WebstaurantStore",
        url: `https://www.webstaurantstore.com/search/${encodedCuisine}-kitchen-equipment.html`,
        label: "Compare new prices at WebstaurantStore",
      },
    ];

    return NextResponse.json({
      ...procurementPlan,
      marketplaceLinks,
      meta: { cuisine, squareFootage, location: location || null, budget: budget || null },
    });
  } catch (error) {
    console.error("Procurement Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Procurement analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
