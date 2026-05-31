import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { analysisFormSchema } from "@/lib/schemas";
import {
  getGoogleMapsKey,
  getOpenAIClient,
  geocodeAddress,
  findNearbyRestaurants,
  enrichWithPlaceDetails,
  haversineDistance,
  type CompetitorDetail,
} from "@/lib/places";

const SYSTEM_PROMPT = `You are an expert restaurant location analyst. You receive structured JSON data about a proposed restaurant location and its nearby competitors. Produce a comprehensive, data-grounded analysis.

CRITICAL RULES:
1. Base ALL claims strictly on the provided data. Do NOT invent numbers, competitors, demographics, or foot traffic figures.
2. If specific data is missing or insufficient, explicitly state "Insufficient data" rather than fabricating.
3. The score and risk assessment MUST reference specific competitor names and their distances.
4. Revenue estimates must be grounded in the user's budget, target revenue, and competitor price levels.
5. Pricing sweet spot must reference competitor price levels (1=cheap, 2=moderate, 3=expensive, 4=very expensive).

Output valid JSON matching this schema:
{
  "score": <number 1-10>,
  "scoreRationale": "<2-3 sentence rationale tied to data>",
  "summary": "<2-3 sentence executive summary>",
  "competitors": [
    {
      "name": "<string>",
      "type": "<string>",
      "rating": <number or null>,
      "priceLevel": <number or null>,
      "userRatingsTotal": <number or null>,
      "distanceKm": <number>,
      "address": "<string>"
    }
  ],
  "footTraffic": {
    "estimatedDaily": "<string e.g. '1,200 - 1,800' or 'Insufficient data'>",
    "notes": "<string explaining basis or data limitation>"
  },
  "revenue": {
    "monthlyEstimate": "<string e.g. '$35,000 - $50,000' or 'Insufficient data'>",
    "pricingSweetSpot": "<string e.g. '$14 - $22 per entree'>"
  },
  "risks": [
    { "risk": "<string>", "severity": "high" | "medium" | "low" }
  ],
  "negotiationAdvice": "<string with specific advice based on model>",
  "menuPricing": "<string with recommended menu price range>",
  "verdict": "good_deal" | "proceed_with_caution" | "avoid"
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = analysisFormSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
    }

    const { address, cuisine, model, takeoverDetails, leaseDetails, budget, targetRevenue } = parsed.data;
    let coordinates = parsed.data.coordinates;

    // Validate keys up-front so the user gets a clear message before any work.
    getGoogleMapsKey();
    const openai = getOpenAIClient();

    let formattedAddress = address;
    if (!coordinates || !coordinates.lat) {
      const geo = await geocodeAddress(address);
      coordinates = { lat: geo.lat, lng: geo.lng };
      formattedAddress = geo.formattedAddress;
    }

    const rawCompetitors = await findNearbyRestaurants(coordinates.lat, coordinates.lng, 1000, 10);
    let competitors: CompetitorDetail[] = [];
    if (rawCompetitors.length > 0) {
      competitors = await enrichWithPlaceDetails(rawCompetitors);
    }

    const competitorData = competitors.map((c) => ({
      name: c.name,
      type: c.types?.[0] || "restaurant",
      rating: c.rating,
      priceLevel: c.priceLevel,
      userRatingsTotal: c.userRatingsTotal,
      distanceKm: Math.round(haversineDistance(coordinates!.lat, coordinates!.lng, c.lat, c.lng) * 100) / 100,
      address: c.vicinity,
    }));

    const businessModelDetails = model === "takeover"
      ? {
          model: "Takeover (buy existing business)",
          askingPrice: takeoverDetails?.askingPrice,
          currentMonthlyRevenue: takeoverDetails?.monthlyRevenue || null,
          yearsInOperation: takeoverDetails?.yearsInOperation || null,
          includedEquipment: takeoverDetails?.includedEquipment || null,
        }
      : {
          model: "Lease empty space",
          monthlyRent: leaseDetails?.monthlyRent,
          squareFootage: leaseDetails?.squareFootage,
          leaseTerm: leaseDetails?.leaseTerm,
          condition: leaseDetails?.condition,
        };

    const analysisPayload = {
      location: {
        address: formattedAddress,
        coordinates,
      },
      businessConcept: cuisine,
      businessModel: businessModelDetails,
      finances: {
        totalBudget: budget,
        targetMonthlyRevenue: targetRevenue,
      },
      competitors: competitorData,
      competitorCount: competitorData.length,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this restaurant location opportunity. Base your entire analysis ONLY on the data below:\n\n${JSON.stringify(analysisPayload, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Empty response from AI analysis");
    }

    const report = JSON.parse(result);
    return NextResponse.json({
      ...report,
      locationDetails: {
        formattedAddress,
        coordinates,
      },
      competitors: competitorData,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
