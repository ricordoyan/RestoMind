import { getApiBaseUrl } from "./storage";

/**
 * POST JSON to one of the Next.js API routes (e.g. "/api/analyze").
 * React Native's fetch is not subject to browser CORS, so these calls work
 * directly against the deployed (or LAN) web app.
 */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const base = await getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Could not reach the server at ${base}. Set the correct API URL in Settings (the app's deployed URL, or your computer's LAN IP like http://192.168.1.20:3000).`
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

// ---- Shared request/response types (mirrors the web API routes) ----

export type AnalyzePayload = {
  address: string;
  cuisine: string;
  model: "takeover" | "lease";
  takeoverDetails: { askingPrice: number } | null;
  leaseDetails: {
    monthlyRent: number;
    squareFootage: number;
    leaseTerm: number;
    condition: string;
  } | null;
  budget: number;
  targetRevenue: number;
};

export type Competitor = {
  name: string;
  type: string;
  rating: number | null;
  priceLevel: number | null;
  userRatingsTotal: number | null;
  distanceKm: number;
  address: string;
};

export type AnalyzeReport = {
  score: number;
  scoreRationale: string;
  summary: string;
  competitors: Competitor[];
  footTraffic: { estimatedDaily: string; notes: string };
  revenue: { monthlyEstimate: string; pricingSweetSpot: string };
  risks: { risk: string; severity: "high" | "medium" | "low" }[];
  negotiationAdvice: string;
  menuPricing: string;
  verdict: "good_deal" | "proceed_with_caution" | "avoid";
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
