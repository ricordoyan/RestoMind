# Restaurant Co-Pilot

AI **location intelligence** for restaurants, inspired by platforms like
SiteZeus. Decide *where* to open against **real** competitor data — score a
site, map its trade area, scout white-space markets, and check cannibalization
— then plan the interior, procurement, marketing, and menu. Everything is
powered by GPT-4o and grounded in structured Google Places data so the model
can't hallucinate numbers.

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind v4,
shadcn/ui, and the OpenAI + Google Maps Platform APIs.

The app is organized into a four-stage suite, surfaced on the landing page:

- **Locate** — Location Analysis, Trade Area Analysis, Market Scout, Impact Analysis
- **Build** — Interior Design, Smart Procurement
- **Operate** — Recipe & Food Cost, Inventory & Ordering, Ops Playbook, Operations Copilot
- **Grow** — Marketing Co-Pilot, Menu Engineer

The **Operate** stage is inspired by operations platforms like Restoke.ai, adapted
to run on GPT-4o with no POS/database integration required.

## Features

### Locate — decide where to open

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
2. **Trade Area Analysis** (`/trade-area` → `/trade-area-report/[id]`) — breaks
   a location into concentric rings (0–0.5 / 0.5–1 / 1–1.5 km) and reports
   competitor density, a saturation score, an estimated customer profile,
   drive-time reach, and opportunities/threats — all derived from live Places
   data, with estimates clearly labelled.
3. **Market Scout** (`/market-scout` → `/market-scout-report/[id]`) —
   white-space analysis: geocodes a city, proposes candidate neighborhoods,
   grounds each with real competitor counts, then ranks them by an opportunity
   score so you can see where demand likely outpaces same-cuisine competition.
4. **Impact Analysis** (`/impact` → `/impact-report/[id]`) — cannibalization
   check for a second location: measures the distance between an existing and a
   proposed site, then estimates trade-area overlap and the share of sales that
   would transfer. Clearly framed as a directional estimate (no mobile-visit
   data).

### Build — open the doors

5. **AI Design Assistant** (`/design`) — upload a photo of the space or enter
   square footage + style, and get a layout plan, mood board, budget tips, and
   reference descriptions.
6. **Smart Procurement** (`/procurement`) — equipment & smallwares checklist by
   category with new vs. used price estimates, scam-avoidance tips, and
   marketplace search links (eBay, Facebook Marketplace, WebstaurantStore).

### Operate — run the day-to-day (inspired by Restoke.ai)

7. **Recipe & Food Cost** (`/recipe-cost` → `/recipe-cost-report/[id]`) — build a
   recipe from its ingredients; the server computes total cost, cost per serving,
   food-cost %, and margin deterministically, then GPT-4o flags the expensive
   ingredients and recommends a price for a target food-cost %.
8. **Inventory & Ordering** (`/inventory` → `/inventory-report/[id]`) — enter stock
   vs. par levels; the app auto-calculates order quantities, flags low/critical
   items, totals the order cost, and GPT suggests par levels, an ordering
   schedule, and waste-reduction tips.
9. **Ops Playbook** (`/playbook` → `/playbook-report/[id]`) — generates
   opening/closing/weekly checklists, food-safety SOPs, role-based training
   modules, and a first-week onboarding plan for your cuisine and service style.
10. **Operations Copilot** (`/copilot`) — a chat with an AI restaurant manager for
    food cost, inventory, staffing, menu, and operations questions (conversation
    persists locally in the browser).

### Grow — fill seats, protect margins

11. **Marketing Co-Pilot** (`/marketing`) — social captions, a logo concept, a
    grand-opening plan, and a 30-day marketing checklist.
12. **Menu Engineer** (`/menu-engineer`) — per-dish profit-margin analysis,
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

   See [API Keys](#api-keys) below for how to obtain each key. Then restart
   the dev server — Next.js only reads env files at startup.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## API Keys

This app requires **two keys**, and you must obtain them yourself — they are
tied to your own accounts and billing, so they cannot be shipped in the repo.
Both are read **server-side** (the app never exposes them to the browser) and
live in a local `.env.local` file that is gitignored.

```
OPENAI_API_KEY=sk-...your real key...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your real key...
```

> ⚠️ Never commit `.env.local`. It is already in `.gitignore` so your keys stay
> private.

### Google Maps API key

Used for Geocoding, Places Nearby Search, Place Details, and the address
Autocomplete widget on the location wizard. Without it you'll see
*"Google Maps API key is not configured"* on the Review step.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   sign in.
2. Create a project (or select an existing one).
3. **Enable billing** on the project. Google provides a large free monthly
   credit and this app's usage is tiny, but a payment method is required to
   activate the Maps APIs.
4. Open **APIs & Services → Library** and enable all three:
   - **Geocoding API**
   - **Places API**
   - **Maps JavaScript API**
5. Open **APIs & Services → Credentials → Create Credentials → API key** and
   copy the key into `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
6. (Recommended) Restrict the key to your domain / localhost and to the three
   APIs above so it can't be misused.

### OpenAI API key

Powers every AI feature (location analysis, design, procurement, marketing,
menu engineering). Without it, "Generate AI Report" fails with
*"OpenAI API key is not configured"*.

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   and sign in.
2. Click **Create new secret key** and copy it (it is shown only once) into
   `OPENAI_API_KEY`.
3. Make sure the account has billing credit — the reports use the GPT-4o model.

### After adding keys

Restart the dev server (`Ctrl+C`, then `npm run dev` again). Env files are only
read at startup, so changes won't take effect until you restart.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
