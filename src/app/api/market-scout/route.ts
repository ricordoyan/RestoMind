import { NextResponse } from "next/server";
import {
  getOpenAIClient,
  geocodeAddress,
  findNearbyRestaurants,
} from "@/lib/places";

interface CandidateProposal {
  name: string;
  searchQuery: string;
}

interface GroundedArea {
  name: string;
  lat: number;
  lng: number;
  competitorCount: number;
  sameCuisineCount: number;
  avgRating: number | null;
  avgPriceLevel: number | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { city, cuisine, notes } = body as {
      city: string;
      cuisine: string;
      notes?: string;
    };

    if (!city || typeof city !== "string" || !city.trim()) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }
    if (!cuisine || typeof cuisine !== "string" || !cuisine.trim()) {
      return NextResponse.json(
        { error: "Cuisine is required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    // Geocode the city center — throws on failure, caught below
    const cityGeo = await geocodeAddress(city.trim());
    const formattedCity = cityGeo.formattedAddress;

    // --- FIRST GPT-4o CALL: propose candidate neighborhoods ---
    const proposalCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a restaurant site-selection expert. Return only valid JSON with no markdown fences.",
        },
        {
          role: "user",
          content: `Propose exactly 5 distinct candidate neighborhoods or districts within "${formattedCity}" that could plausibly support a ${cuisine} restaurant. For each, provide a geocodable searchQuery like "<neighborhood>, <city>, <state/country>". Return JSON: { "candidates": [ { "name": string, "searchQuery": string } ] }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 600,
    });

    const proposalRaw = proposalCompletion.choices[0]?.message?.content ?? "{}";
    const proposalJson = JSON.parse(proposalRaw) as {
      candidates?: CandidateProposal[];
    };
    const candidates: CandidateProposal[] = (
      proposalJson.candidates ?? []
    ).slice(0, 5);

    // --- Geocode each candidate + fetch nearby restaurants ---
    const cuisineLower = cuisine.toLowerCase();

    const groundedAreas: GroundedArea[] = [];

    for (const candidate of candidates) {
      try {
        const geo = await geocodeAddress(candidate.searchQuery);
        const nearby = await findNearbyRestaurants(geo.lat, geo.lng, 1500, 20);

        const competitorCount = nearby.length;

        const sameCuisineCount = nearby.filter((r) => {
          const nameLower = r.name.toLowerCase();
          const typeStr = r.types.join(" ").toLowerCase();
          return (
            nameLower.includes(cuisineLower) ||
            typeStr.includes(cuisineLower) ||
            // Handle common type mappings
            (cuisineLower === "italian" && typeStr.includes("italian")) ||
            (cuisineLower === "chinese" && typeStr.includes("chinese")) ||
            (cuisineLower === "japanese" &&
              (typeStr.includes("japanese") || typeStr.includes("sushi"))) ||
            (cuisineLower === "sushi" &&
              (typeStr.includes("sushi") || typeStr.includes("japanese"))) ||
            (cuisineLower === "mexican" && typeStr.includes("mexican")) ||
            (cuisineLower === "indian" && typeStr.includes("indian")) ||
            (cuisineLower === "thai" && typeStr.includes("thai")) ||
            (cuisineLower === "vietnamese" && typeStr.includes("vietnamese")) ||
            (cuisineLower === "korean" && typeStr.includes("korean")) ||
            (cuisineLower === "mediterranean" &&
              typeStr.includes("mediterranean")) ||
            (cuisineLower === "middle eastern" &&
              typeStr.includes("middle_eastern")) ||
            (cuisineLower === "french" && typeStr.includes("french")) ||
            (cuisineLower === "seafood" && typeStr.includes("seafood")) ||
            (cuisineLower === "american / burger" &&
              (typeStr.includes("american") || typeStr.includes("burger"))) ||
            (cuisineLower === "pizza" && typeStr.includes("pizza")) ||
            (cuisineLower === "steakhouse" && typeStr.includes("steak")) ||
            (cuisineLower === "bbq" && typeStr.includes("bbq")) ||
            (cuisineLower === "latin american" && typeStr.includes("latin"))
          );
        }).length;

        const ratedRestaurants = nearby.filter(
          (r) => typeof r.rating === "number"
        );
        const avgRating =
          ratedRestaurants.length > 0
            ? Math.round(
                (ratedRestaurants.reduce(
                  (sum, r) => sum + (r.rating as number),
                  0
                ) /
                  ratedRestaurants.length) *
                  100
              ) / 100
            : null;

        const pricedRestaurants = nearby.filter(
          (r) => typeof r.priceLevel === "number"
        );
        const avgPriceLevel =
          pricedRestaurants.length > 0
            ? Math.round(
                (pricedRestaurants.reduce(
                  (sum, r) => sum + (r.priceLevel as number),
                  0
                ) /
                  pricedRestaurants.length) *
                  100
              ) / 100
            : null;

        groundedAreas.push({
          name: candidate.name,
          lat: geo.lat,
          lng: geo.lng,
          competitorCount,
          sameCuisineCount,
          avgRating,
          avgPriceLevel,
        });
      } catch {
        // Skip candidates that fail to geocode or fetch
        continue;
      }
    }

    // --- SECOND GPT-4o CALL: score & rank ---
    const scoringCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a restaurant market analyst specializing in white-space opportunity analysis.

CRITICAL RULES:
1. Base ALL scores and saturation labels SOLELY on the competitor data provided. Do NOT invent population, income, or demographic numbers.
2. White-space opportunity (opportunityScore 1-100) is HIGHER when same-cuisine competition is LOW relative to total restaurant activity in the area.
3. If you include any demographic or neighborhood character statements, explicitly label them as estimates.
4. saturation must be one of: "low" | "moderate" | "high" — derived from sameCuisineCount relative to competitorCount.
5. verdict must be one of: "prime" | "promising" | "saturated".
6. rationale MUST reference the specific competitorCount and sameCuisineCount numbers provided.
7. Return only valid JSON with no markdown fences.`,
        },
        {
          role: "user",
          content: `City: ${formattedCity}
Cuisine: ${cuisine}
${notes ? `Additional context: ${notes}` : ""}

Neighborhood data (from real Google Maps nearby-restaurant queries):
${JSON.stringify(groundedAreas, null, 2)}

Score and rank these neighborhoods for opening a ${cuisine} restaurant. Return JSON exactly matching this schema:
{
  "marketSummary": "<2-3 sentence overview of the market opportunity in ${formattedCity} for ${cuisine}>",
  "areas": [
    {
      "name": "<neighborhood name>",
      "opportunityScore": <number 1-100>,
      "competitorCount": <echo the competitorCount from data>,
      "sameCuisineCount": <echo the sameCuisineCount from data>,
      "avgCompetitorRating": <echo avgRating or null>,
      "saturation": "<low|moderate|high>",
      "verdict": "<prime|promising|saturated>",
      "rationale": "<1-2 sentences referencing the specific counts>"
    }
  ],
  "topPick": "<name of the single best neighborhood>",
  "recommendation": "<2-3 actionable sentences for an operator considering opening a ${cuisine} restaurant in ${formattedCity}>"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1200,
    });

    const scoringRaw =
      scoringCompletion.choices[0]?.message?.content ?? "{}";
    const modelJson = JSON.parse(scoringRaw) as {
      marketSummary: string;
      areas: Array<{
        name: string;
        opportunityScore: number;
        competitorCount: number;
        sameCuisineCount: number;
        avgCompetitorRating: number | null;
        saturation: "low" | "moderate" | "high";
        verdict: "prime" | "promising" | "saturated";
        rationale: string;
      }>;
      topPick: string;
      recommendation: string;
    };

    // Sort areas by opportunityScore descending
    const areas = (modelJson.areas ?? []).sort(
      (a, b) => b.opportunityScore - a.opportunityScore
    );

    return NextResponse.json({
      marketSummary: modelJson.marketSummary ?? "",
      areas,
      topPick: modelJson.topPick ?? "",
      recommendation: modelJson.recommendation ?? "",
      meta: {
        city: formattedCity,
        cuisine,
        areaCount: areas.length,
      },
    });
  } catch (error) {
    console.error("Market Scout Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Market Scout analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
