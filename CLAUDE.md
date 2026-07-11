# hackathon

Monorepo with separate `backend`, `frontend`, and `mobile` apps, no shared root package.json. The frontend is a landing page only; the product workflow is mobile-only. Run commands from within each subdirectory.

## Stack

- **backend**: Node.js (ESM), TypeScript (run with `tsx`, no build step), Express 5, Google Gemini via `@google/genai` through Vertex AI, `dotenv`, `cors`, `multer`. Entry point `backend/index.ts`.
- **frontend**: React 19 + Vite, TypeScript/TSX landing page only.
- **mobile**: Expo SDK 54 (React Native), TypeScript, `expo-camera`, `expo-location`. Entry point `mobile/App.tsx` (thin composition root); code lives in `mobile/src/` split into `screens/` (ScanScreen, PreviewSheet, RecommendationScreen, RepairScreen, SellScreen, DonateScreen, RecycleScreen), `components/` (AppButton, BottomSheet, FormSkeleton, RecommendationDetail), `hooks/` (`usePhotoCapture`, `usePreviewForm`, `useRecommendation`), `api.ts`, `tradeIn.ts` (local Apple trade-in value lookup against `mobile/data/*_tradein.json`), and `types.ts`.

## Commands

Backend (from `backend/`):
- `npm run dev` — start with tsx watch (auto-restart)
- `npm start` — start with tsx
- `npm run typecheck` — tsc --noEmit
- `npm run lint` — ESLint

Frontend landing page (from `frontend/`):
- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b` then Vite production build
- `npm run typecheck` — `tsc -b`
- `npm run lint` — ESLint

Mobile (from `mobile/`):
- `npm start` — Expo dev server (open in Expo Go)
- `npx tsc --noEmit` — typecheck

## CI

`.github/workflows/lint.yml` runs `npm run lint` for both `backend` and `frontend` on push to `main` and on every pull request.

## Environment

Backend requires a `.env` file (see `backend/.env.example`) with the GCP project config. Gemini is called strictly through Vertex AI — no API-key mode. Auth uses Application Default Credentials: `GOOGLE_APPLICATION_CREDENTIALS=./keys/service-account.json` (relative to `backend/`, where npm runs). `backend/keys/` and `.env` are gitignored at the repo root — never commit either.

## Gemini API usage

Use the `@google/genai` SDK, not the older `@google/generative-ai` package, in Vertex mode:

```ts
import { GoogleGenAI } from '@google/genai'
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
})
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'prompt text',
})
response.text
```

Note: Vertex AI was renamed "Gemini Enterprise Agent Platform" in the GCP console (May 2026); the service to enable is still `aiplatform.googleapis.com`.

## Frontend routes

`frontend/src/App.tsx` defines one route via `react-router-dom`:
- `/` — `frontend/src/pages/Landing.tsx`, the marketing/pitch page (hero, "how it works", "Try it" CTA).

The landing page is the only frontend page in the build and deploy. The
device workflow is implemented in the mobile app.

## Design system

`DESIGN.md` at the repo root documents the brand's colors, typography,
spacing, motion, and component patterns, extracted from the landing page
(`frontend/src/pages/Landing.tsx` + `Landing.css`) and the mobile theme.
Consult it before styling any new UI so surfaces stay visually consistent,
and update it if the design system itself changes.

## Status

`backend/index.ts` exposes `GET /api/health` plus six Gemini-backed POST routes, all returning schema-constrained JSON in AUD: `/api/device` (legacy two-photo appraisal), `/api/preview` (photos → model/RAM/storage/condition/description/resale range), `/api/estimate` (edited form fields → recalculated resale range), `/api/donate-locations` and `/api/recycle-locations` (model + location name → grounded-search list of real nearby donation/recycling spots with Google Maps links), and `/api/recommend` (form fields → fix/sell/tradeIn/donate/recycle blurbs, a device-specific repair plan, and one recommended pick). `frontend` contains only the landing page. `mobile` implements the full flow: scan (front/back + optional About-screen photo, confirm/retake) → preview sheet (skeleton while analyzing, auto-filled editable form, debounced re-estimation) → recommendation view (five swipeable cards, AI pick badged, trade-in value computed locally from Apple's published trade-in tables rather than a Gemini call) → tapping fix/sell/donate/recycle opens a full-screen detail sheet (repair plan with DIY/professional cost and resale-value-increase breakdown plus repair-guide links, marketplace listing copy for selling, or nearby donation/recycling spots resolved from device location).

**Known issue:** `mobile/src/api.ts`'s `requestRecyclingLocations` posts to `/api/recycling-locations`, but the backend route is `/api/recycle-locations` (`backend/index.ts`) — the Recycle detail screen's location lookup currently 404s.
