import { NextResponse } from "next/server";
import {
  getOpenAIClient,
  geocodeAddress,
  findNearbyRestaurants,
  enrichWithPlaceDetails,
  haversineDistance,
} from "@/lib/places";

const SYSTEM_PROMPT = `You are an expert retail trade area analyst specializing in restaurant site selection.
Given data about a restaurant location and its surrounding competitive landscape, provide a thorough trade area analysis.

CRITICAL RULES:
1. Base EVERYTHING only on the competitor data and ring statistics provided. Never invent foot-traffic counts, census figures, or demographic data that wasn't supplied.
2. If the provided data is insufficient to make a confident statement, say "Insufficient data to determine this."
3. Demographics and customer profile segments are ESTIMATES derived solely from competitor mix, price levels, and area density. Always label them as estimates.
4. Drive times are geometric estimates based on assumed speeds and ring radii — label them as estimated and note they vary by traffic conditions.
5. Saturation score must be justified strictly from competitor counts, density, and ratings data given.

Output valid JSON matching this schema exactly:
{
  "tradeAreaSummary": "<string - 2-3 sentences summarizing the trade area based only on provided data>",
  "estimatedTradeAreaRadiusKm": <number - primary catchment radius in km, e.g. 1.5>,
  "driveTime": {
    "fiveMin": "<string - estimated reachable area in 5 min drive plus caveat>",
    "tenMin": "<string - estimated reachable area in 10 min drive plus caveat>",
    "fifteenMin": "<string - estimated reachable area in 15 min drive plus caveat>"
  },
  "customerProfile": {
    "segments": [
      { "name": "<string>", "description": "<string>", "sharePercent": <number 0-100> }
    ],
    "notes": "<string - clarify these are estimates based on competitor mix only>"
  },
  "saturation": {
    "level": "<'low'|'moderate'|'high'>",
    "score": <number 1-10>,
    "rationale": "<string - justify from competitor counts and density data>"
  },
  "opportunities": ["<string>", "<string>", "<string>"],
  "threats": ["<string>", "<string>", "<string>"],
  "recommendation": "<string - actionable recommendation based on provided data>"
}`;

type Ring = {
  label: string;
  radiusKm: number;
  count: number;
  avgRating: number | null;
  avgPriceLevel: number | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      address?: string;
      coordinates?: { lat?: number; lng?: number };
      cuisine?: string;
      notes?: string;
    };

    const { address, coordinates, cuisine, notes } = body;

    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }
    if (!cuisine || typeof cuisine !== "string" || !cuisine.trim()) {
      return NextResponse.json({ error: "Cuisine type is required" }, { status: 400 });
    }

    const openai = getOpenAIClient();

    // Resolve coordinates
    let lat: number;
    let lng: number;
    let formattedAddress: string;

    if (coordinates?.lat && coordinates?.lng) {
      lat = coordinates.lat;
      lng = coordinates.lng;
      formattedAddress = address.trim();
    } else {
      const geo = await geocodeAddress(address.trim());
      lat = geo.lat;
      lng = geo.lng;
      formattedAddress = geo.formattedAddress;
    }

    // Fetch and enrich competitors within 1500m
    const rawCompetitors = await findNearbyRestaurants(lat, lng, 1500, 20);
    const enriched = await enrichWithPlaceDetails(rawCompetitors);

    // Compute distances and flatten to serializable shape
    const competitors = enriched.map((c) => ({
      name: c.name,
      type: c.types?.[0] ?? "restaurant",
      rating: c.rating,
      priceLevel: c.priceLevel,
      userRatingsTotal: c.userRatingsTotal,
      distanceKm: Math.round(haversineDistance(lat, lng, c.lat, c.lng) * 1000) / 1000,
      address: c.vicinity,
    }));

    // Build concentric rings
    const ringBuckets: Array<typeof competitors> = [[], [], []];
    for (const comp of competitors) {
      if (comp.distanceKm <= 0.5) ringBuckets[0].push(comp);
      else if (comp.distanceKm <= 1.0) ringBuckets[1].push(comp);
      else if (comp.distanceKm <= 1.5) ringBuckets[2].push(comp);
    }

    const rings: Ring[] = ringBuckets.map((bucket, i) => {
      const labels = ["0–0.5 km", "0.5–1 km", "1–1.5 km"];
      const radii = [0.5, 1.0, 1.5];
      const rated = bucket.filter((c) => typeof c.rating === "number");
      const priced = bucket.filter((c) => typeof c.priceLevel === "number");
      const avgRating =
        rated.length > 0
          ? Math.round((rated.reduce((s, c) => s + (c.rating as number), 0) / rated.length) * 100) / 100
          : null;
      const avgPriceLevel =
        priced.length > 0
          ? Math.round((priced.reduce((s, c) => s + (c.priceLevel as number), 0) / priced.length) * 100) / 100
          : null;
      return { label: labels[i], radiusKm: radii[i], count: bucket.length, avgRating, avgPriceLevel };
    });

    // Dominant cuisines tally
    const cuisineTally: Record<string, number> = {};
    for (const comp of competitors) {
      const type = comp.type.replace(/_/g, " ");
      cuisineTally[type] = (cuisineTally[type] ?? 0) + 1;
    }
    const dominantCuisines = Object.entries(cuisineTally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({ type, count }));

    // Build grounded prompt
    const ringsSummary = rings
      .map(
        (r) =>
          `  ${r.label}: ${r.count} competitors, avg rating ${r.avgRating ?? "N/A"}, avg price level ${r.avgPriceLevel ?? "N/A"}`
      )
      .join("\n");

    const competitorList = competitors
      .slice(0, 15)
      .map(
        (c, i) =>
          `  ${i + 1}. ${c.name} — type: ${c.type}, rating: ${c.rating ?? "N/A"}, price: ${c.priceLevel ?? "N/A"}, distance: ${c.distanceKm.toFixed(2)} km`
      )
      .join("\n");

    const cuisineList = dominantCuisines.map((d) => `  ${d.type}: ${d.count}`).join("\n");

    const userContent = `Analyze the trade area for a new ${cuisine} restaurant at the following location.

Location: ${formattedAddress}
Cuisine: ${cuisine}
${notes ? `Additional Notes: ${notes}` : ""}

Competitor Ring Data (based on ${competitors.length} nearby restaurants within 1.5 km):
${ringsSummary}

Top Nearby Competitors:
${competitorList || "  No competitors found within 1.5 km."}

Dominant Cuisine Types in Area:
${cuisineList || "  No data."}

Total competitors within 1.5 km: ${competitors.length}

Remember: base your analysis ONLY on the above data. Do not invent demographic statistics.`;

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
    if (!raw) throw new Error("Empty response from AI trade area analysis");

    const modelJson = JSON.parse(raw) as {
      tradeAreaSummary: string;
      estimatedTradeAreaRadiusKm: number;
      driveTime: { fiveMin: string; tenMin: string; fifteenMin: string };
      customerProfile: {
        segments: Array<{ name: string; description: string; sharePercent: number }>;
        notes: string;
      };
      saturation: { level: "low" | "moderate" | "high"; score: number; rationale: string };
      opportunities: string[];
      threats: string[];
      recommendation: string;
    };

    return NextResponse.json({
      ...modelJson,
      rings,
      dominantCuisines,
      competitors,
      meta: { address: formattedAddress, cuisine, coordinates: { lat, lng } },
    });
  } catch (error) {
    console.error("Trade Area Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Trade area analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
