# Restaurant Co-Pilot — iOS / Mobile App

An [Expo](https://expo.dev) (React Native + TypeScript) mobile client for the
Restaurant Co-Pilot platform. It reuses the **same backend** as the web app —
it calls the Next.js API routes (`/api/*`) over the network — so there is no
separate server to run.

> **Why Expo?** iOS binaries can only be *compiled* on macOS with Xcode. Expo
> lets you (a) run the app on a real iPhone with **no Mac** via the **Expo Go**
> app during development, and (b) produce a real App Store build in the cloud via
> **EAS Build** — again with no local Mac required.

## Screens

- **Home** — the suite (links into each tool)
- **Location Analysis** — form → `/api/analyze` → an inline report (score,
  verdict, competitors, revenue, risks, negotiation advice)
- **Operations Copilot** — chat with the AI restaurant manager (`/api/copilot`)
- **Settings** — set the API base URL the app talks to

(The remaining web tools — Trade Area, Market Scout, Impact, Recipe Cost,
Inventory, Ops Playbook, Marketing, Menu Engineer — follow the exact same
pattern: a screen that POSTs to its `/api/*` route. They can be added by copying
`app/analyze.tsx` and pointing it at the relevant endpoint.)

## Prerequisites

- Node 18+
- The **web app running and reachable** from your phone — either deployed
  (e.g. Vercel) or on your LAN. A phone cannot reach `localhost`; for local dev
  use your computer's LAN IP, e.g. `http://192.168.1.20:3000`, and start the web
  app with `npm run dev` in the repo root.
- The web server must have `OPENAI_API_KEY` (and the Google Maps key for
  Location Analysis) configured in its `.env.local`.

## Run it on your iPhone (no Mac needed)

```bash
cd mobile
npm install
npx expo install --fix     # align native package versions to the Expo SDK
npx expo start             # scan the QR code with the Expo Go app on your iPhone
```

In the app, open **Settings** and set the **API Base URL** to your web app's
address. Then use the tools.

## Build a real iOS app for the App Store (no Mac needed)

Uses [EAS Build](https://docs.expo.dev/build/introduction/) (cloud macOS
builders). You need a free Expo account and an Apple Developer account for
store submission.

```bash
npm install -g eas-cli
eas login
eas build --platform ios          # cloud-built .ipa
eas submit --platform ios         # optional: upload to App Store Connect
```

## Configuration

- Default API URL lives in `app.json` → `expo.extra.apiBaseUrl`. The in-app
  **Settings** screen overrides it (stored on-device via AsyncStorage).
- Theme tokens are in `src/theme.ts`; the API client and shared types are in
  `src/api.ts`.

## Notes & limitations

- This project was scaffolded in a Linux environment, where iOS apps **cannot be
  compiled or run** (Apple requires macOS/Xcode). Run the commands above on your
  own machine to launch it. Versions in `package.json` are reconciled to your
  installed Expo SDK by `npx expo install --fix`.
- React Native's `fetch` is not subject to browser CORS, so the API routes work
  as-is without CORS changes.
