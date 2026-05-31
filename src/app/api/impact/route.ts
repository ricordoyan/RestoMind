import { NextResponse } from "next/server";
import {
  getOpenAIClient,
  geocodeAddress,
  findNearbyRestaurants,
  haversineDistance,
} from "@/lib/places";

const SYSTEM_PROMPT = `You are a restaurant trade-area analyst. You receive structured data about an EXISTING restaurant location and a PROPOSED NEW location for the same brand. Estimate the sales cannibalization risk.

CRITICAL RULES:
1. Base ALL reasoning ONLY on the inter-site distance and nearby competitor density provided. Do NOT invent visit counts, mobile-location data, or demographics.
2. Cannibalization is HIGHER when the two sites are CLOSE (heavy trade-area overlap under ~1 km, negligible beyond ~5 km) and LOWER when local competition is dense (many alternatives reduce the share of customers the existing store would lose).
3. This is a DIRECTIONAL ESTIMATE. Explicitly acknowledge in your output that this analysis lacks real mobile-visit / foot-traffic data.
4. Never fabricate exact visit counts.
5. If existingMonthlyRevenue is provided (not null), estimate dollar ranges for salesTransfer and netNewRevenue. If it is null, give percentage ranges only and set netNewRevenue to "Provide existing revenue for a dollar estimate".
6. overlapPercent = estimated share of trade areas that physically overlap (0-100).
7. cannibalizationPercent = estimated share of existing store's sales that would transfer to the new location (0-100).
8. riskLevel: "low" if cannibalizationPercent < 15, "moderate" if 15-35, "high" if > 35.
9. verdict: "expand" if cannibalization is low and the new site adds net new customers; "caution" if moderate risk; "too_close" if high risk.
10. factors array must have 3-4 items; each item's "impact" field describes its effect ON CANNIBALIZATION ("increases" = raises cannibalization, "reduces" = lowers cannibalization).

Output valid JSON matching this schema EXACTLY:
{
  "overlapPercent": <number 0-100>,
  "cannibalizationPercent": <number 0-100>,
  "riskLevel": "low" | "moderate" | "high",
  "salesTransfer": { "estimate": "<string>", "basis": "<string>" },
  "netNewRevenue": "<string>",
  "summary": "<string - 2-3 sentences>",
  "factors": [
    { "factor": "<string>", "impact": "increases" | "reduces", "note": "<string>" }
  ],
  "recommendation": "<string - 2-3 actionable sentences>",
  "verdict": "expand" | "caution" | "too_close"
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      existingAddress?: unknown;
      existingCoords?: { lat?: unknown; lng?: unknown };
      newAddress?: unknown;
      newCoords?: { lat?: unknown; lng?: unknown };
      cuisine?: unknown;
      existingMonthlyRevenue?: unknown;
    };

    const { existingAddress, existingCoords, newAddress, newCoords, cuisine, existingMonthlyRevenue } = body;

    if (!existingAddress || typeof existingAddress !== "string" || !existingAddress.trim()) {
      return NextResponse.json({ error: "existingAddress is required" }, { status: 400 });
    }
    if (!newAddress || typeof newAddress !== "string" || !newAddress.trim()) {
      return NextResponse.json({ error: "newAddress is required" }, { status: 400 });
    }
    if (!cuisine || typeof cuisine !== "string" || !cuisine.trim()) {
      return NextResponse.json({ error: "cuisine is required" }, { status: 400 });
    }

    const openai = getOpenAIClient();

    // Geocode whichever location lacks coords
    const hasExistingCoords =
      existingCoords &&
      typeof existingCoords.lat === "number" &&
      typeof existingCoords.lng === "number";
    const hasNewCoords =
      newCoords &&
      typeof newCoords.lat === "number" &&
      typeof newCoords.lng === "number";

    const [existingGeo, newGeo] = await Promise.all([
      hasExistingCoords
        ? Promise.resolve({ lat: existingCoords.lat as number, lng: existingCoords.lng as number, formattedAddress: existingAddress })
        : geocodeAddress(existingAddress),
      hasNewCoords
        ? Promise.resolve({ lat: newCoords.lat as number, lng: newCoords.lng as number, formattedAddress: newAddress })
        : geocodeAddress(newAddress),
    ]);

    const distanceKm = Math.round(haversineDistance(existingGeo.lat, existingGeo.lng, newGeo.lat, newGeo.lng) * 100) / 100;

    // Find nearby restaurants around the new location for context
    const nearby = await findNearbyRestaurants(newGeo.lat, newGeo.lng, 1500, 20);
    const nearbyCount = nearby.length;
    const cuisineKeyword = cuisine.toLowerCase().split(" /")[0].split(" ")[0];
    const sameCuisineCount = nearby.filter((r) => {
      const nameMatch = r.name.toLowerCase().includes(cuisineKeyword);
      const typeMatch = r.types.some((t) => t.toLowerCase().includes(cuisineKeyword));
      return nameMatch || typeMatch;
    }).length;

    const revenueValue = (typeof existingMonthlyRevenue === "number" && existingMonthlyRevenue > 0)
      ? existingMonthlyRevenue
      : null;

    const userPrompt = `Analyze cannibalization risk between these two locations:

EXISTING LOCATION: ${existingGeo.formattedAddress}
PROPOSED NEW LOCATION: ${newGeo.formattedAddress}
CUISINE TYPE: ${cuisine}
INTER-SITE DISTANCE: ${distanceKm} km
EXISTING MONTHLY REVENUE: ${revenueValue !== null ? `$${revenueValue.toLocaleString()}` : "Not provided"}

CONTEXT AROUND NEW LOCATION (1.5 km radius):
- Total nearby restaurants: ${nearbyCount}
- Same-cuisine competitors: ${sameCuisineCount}

Based strictly on distance and competitor density, estimate trade-area overlap and cannibalization.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Empty response from AI analysis");
    }

    const modelJson = JSON.parse(raw) as Record<string, unknown>;

    return NextResponse.json({
      ...modelJson,
      distanceKm,
      meta: {
        existingAddress: existingGeo.formattedAddress,
        newAddress: newGeo.formattedAddress,
        cuisine,
        existingMonthlyRevenue: revenueValue,
        nearbyCount,
        sameCuisineCount,
      },
    });
  } catch (error) {
    console.error("Impact Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Impact analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
