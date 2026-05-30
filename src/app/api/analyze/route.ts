import { NextResponse } from "next/server";
import { Client } from "@googlemaps/google-maps-services-js";
import OpenAI from "openai";
import { analysisFormSchema } from "@/lib/schemas";
import { ZodError } from "zod";

const client = new Client({});

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

type CompetitorDetail = {
  name: string;
  types: string[];
  rating: number | null;
  priceLevel: number | null;
  userRatingsTotal: number | null;
  placeId: string;
  vicinity: string;
  lat: number;
  lng: number;
};

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const geoRes = await client.geocode({
    params: { address, key: apiKey },
    timeout: 5000,
  });
  if (!geoRes.data.results.length) {
    throw new Error("Address could not be geocoded. Please enter a valid address.");
  }
  const { lat, lng } = geoRes.data.results[0].geometry.location;
  return { lat, lng, formattedAddress: geoRes.data.results[0].formatted_address };
}

async function findNearbyRestaurants(lat: number, lng: number): Promise<CompetitorDetail[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const placesRes = await client.placesNearby({
    params: {
      location: { lat, lng },
      radius: 1000,
      type: "restaurant",
      key: apiKey,
    },
    timeout: 5000,
  });
  return (placesRes.data.results || []).slice(0, 10).map((p) => ({
    name: p.name || "Unknown",
    types: p.types || [],
    rating: p.rating || null,
    priceLevel: p.price_level ?? null,
    userRatingsTotal: p.user_ratings_total || null,
    placeId: p.place_id || "",
    vicinity: p.vicinity || "",
    lat: p.geometry?.location?.lat || 0,
    lng: p.geometry?.location?.lng || 0,
  }));
}

async function enrichWithPlaceDetails(competitors: CompetitorDetail[]): Promise<CompetitorDetail[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const enriched = await Promise.all(
    competitors.map(async (comp) => {
      if (!comp.placeId) return comp;
      try {
        const detailRes = await client.placeDetails({
          params: {
            place_id: comp.placeId,
            key: apiKey,
            fields: ["name", "rating", "price_level", "types", "user_ratings_total", "formatted_address", "geometry"],
          },
          timeout: 3000,
        });
        const d = detailRes.data.result;
        return {
          ...comp,
          rating: d.rating ?? comp.rating,
          priceLevel: d.price_level ?? comp.priceLevel,
          types: d.types || comp.types,
          userRatingsTotal: d.user_ratings_total ?? comp.userRatingsTotal,
          vicinity: d.formatted_address || comp.vicinity,
        };
      } catch {
        return comp;
      }
    })
  );
  return enriched;
}

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

    const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    if (!googleMapsKey || googleMapsKey === "your_google_maps_api_key_here") {
      return NextResponse.json(
        { error: "Google Maps API key is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local" },
        { status: 500 }
      );
    }
    if (!openAIKey || openAIKey === "your_openai_api_key_here") {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    let formattedAddress = address;
    if (!coordinates || !coordinates.lat) {
      const geo = await geocodeAddress(address);
      coordinates = { lat: geo.lat, lng: geo.lng };
      formattedAddress = geo.formattedAddress;
    }

    const rawCompetitors = await findNearbyRestaurants(coordinates.lat, coordinates.lng);
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

    const openai = new OpenAI({ apiKey: openAIKey });
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
