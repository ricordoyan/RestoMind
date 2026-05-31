import { Client } from "@googlemaps/google-maps-services-js";
import OpenAI from "openai";

export const mapsClient = new Client({});

export type CompetitorDetail = {
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

/** A user-facing configuration error. Routes should return these as a 500 with the message. */
export class ConfigError extends Error {}

export function getGoogleMapsKey(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || key === "your_google_maps_api_key_here") {
    throw new ConfigError(
      "Google Maps API key is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local"
    );
  }
  return key;
}

export function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "your_openai_api_key_here") {
    throw new ConfigError(
      "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local"
    );
  }
  return new OpenAI({ apiKey: key });
}

/** Distance between two coordinates in kilometres (Haversine). */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string }> {
  const apiKey = getGoogleMapsKey();
  const geoRes = await mapsClient.geocode({
    params: { address, key: apiKey },
    timeout: 5000,
  });
  if (!geoRes.data.results.length) {
    throw new Error(`"${address}" could not be geocoded. Please enter a valid address.`);
  }
  const { lat, lng } = geoRes.data.results[0].geometry.location;
  return { lat, lng, formattedAddress: geoRes.data.results[0].formatted_address };
}

export async function findNearbyRestaurants(
  lat: number,
  lng: number,
  radius = 1000,
  limit = 20
): Promise<CompetitorDetail[]> {
  const apiKey = getGoogleMapsKey();
  const placesRes = await mapsClient.placesNearby({
    params: { location: { lat, lng }, radius, type: "restaurant", key: apiKey },
    timeout: 5000,
  });
  return (placesRes.data.results || []).slice(0, limit).map((p) => ({
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

export async function enrichWithPlaceDetails(
  competitors: CompetitorDetail[]
): Promise<CompetitorDetail[]> {
  const apiKey = getGoogleMapsKey();
  return Promise.all(
    competitors.map(async (comp) => {
      if (!comp.placeId) return comp;
      try {
        const detailRes = await mapsClient.placeDetails({
          params: {
            place_id: comp.placeId,
            key: apiKey,
            fields: [
              "name",
              "rating",
              "price_level",
              "types",
              "user_ratings_total",
              "formatted_address",
              "geometry",
            ],
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
}

/** Summarise a list of competitors into compact aggregate stats for grounding prompts. */
export function summariseCompetitors(competitors: CompetitorDetail[], origin: { lat: number; lng: number }) {
  const withDistance = competitors.map((c) => ({
    name: c.name,
    type: c.types?.[0] || "restaurant",
    rating: c.rating,
    priceLevel: c.priceLevel,
    userRatingsTotal: c.userRatingsTotal,
    distanceKm: Math.round(haversineDistance(origin.lat, origin.lng, c.lat, c.lng) * 100) / 100,
    address: c.vicinity,
  }));
  const rated = withDistance.filter((c) => typeof c.rating === "number");
  const priced = withDistance.filter((c) => typeof c.priceLevel === "number");
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, c) => s + (c.rating as number), 0) / rated.length) * 100) / 100
    : null;
  const avgPriceLevel = priced.length
    ? Math.round((priced.reduce((s, c) => s + (c.priceLevel as number), 0) / priced.length) * 100) / 100
    : null;
  return { competitors: withDistance, count: withDistance.length, avgRating, avgPriceLevel };
}
