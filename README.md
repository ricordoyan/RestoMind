# Restaurant Co-Pilot

An AI co-pilot for restaurant operators and investors. Evaluate a potential
location against **real** competitor data, then plan the interior, procurement,
marketing, and menu — all powered by GPT-4o and grounded in structured data so
the model can't hallucinate numbers.

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind v4,
shadcn/ui, and the OpenAI + Google Maps Platform APIs.

## Features

1. **Location Analysis** (`/analyze` → `/report/[id]`)
   - A 5-step required-field wizard: location (Google Places Autocomplete),
     cuisine, business model (takeover vs. lease, with model-specific fields),
     finances, and a review step.
   - The form is validated client-side at every step **and** re-validated
     server-side with Zod — no report is generated on an incomplete form.
   - The API route geocodes the address, pulls nearby restaurants via Places
     Nearby Search (1 km) enriched with Place Details (rating, price level,
     review count, types), assembles everything into a structured JSON payload,
     and only then sends it to GPT-4o. The prompt forces the model to base all
     analysis on the provided data and to say "Insufficient data" rather than
     invent figures.
   - The report includes an attractiveness score (1–10), a competitor table,
     foot-traffic and revenue estimates, top risks, negotiation advice,
     a menu-pricing sweet spot, and a final verdict.
2. **AI Design Assistant** (`/design`) — upload a photo of the space or enter
   square footage + style, and get a layout plan, mood board, budget tips, and
   reference descriptions.
3. **Smart Procurement** (`/procurement`) — equipment & smallwares checklist by
   category with new vs. used price estimates, scam-avoidance tips, and
   marketplace search links (eBay, Facebook Marketplace, WebstaurantStore).
4. **Marketing Co-Pilot** (`/marketing`) — social captions, a logo concept, a
   grand-opening plan, and a 30-day marketing checklist.
5. **Menu Engineer** (`/menu-engineer`) — per-dish profit-margin analysis,
   price adjustments, star dishes, unprofitable flags, and layout tips.

All AI calls run **server-side** in API routes (`src/app/api/*`) so the keys
are never exposed to the browser.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure your keys:

   ```bash
   cp .env.example .env.local
   # then edit .env.local with your real OpenAI and Google Maps keys
   ```

   Enable the **Geocoding API**, **Places API**, and **Maps JavaScript API**
   for your Google Maps key.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
