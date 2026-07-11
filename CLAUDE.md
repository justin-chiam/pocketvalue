# hackathon

Monorepo with separate `backend`, `frontend`, and `mobile` apps, no shared root package.json. Run commands from within each subdirectory.

## Stack

- **backend**: Node.js (ESM), TypeScript (run with `tsx`, no build step), Express 5, Google Gemini via `@google/genai` through Vertex AI, `dotenv`, `cors`, `multer`. Entry point `backend/index.ts`.
- **frontend**: React 19 + Vite, plain JS (`.jsx`, not TypeScript), `react-router-dom` for client-side routing.
- **mobile**: Expo SDK 54 (React Native), TypeScript, `expo-camera`. Entry point `mobile/App.tsx` (thin composition root); code lives in `mobile/src/` split into `screens/` (ScanScreen, PreviewSheet, RecommendationScreen), `components/`, `hooks/` (`usePhotoCapture`, `usePreviewForm`, `useRecommendation`), `api.ts`, and `types.ts`.

## Commands

Backend (from `backend/`):
- `npm run dev` — start with tsx watch (auto-restart)
- `npm start` — start with tsx
- `npm run typecheck` — tsc --noEmit
- `npm run lint` — ESLint

Frontend (from `frontend/`):
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

`frontend/src/App.tsx` defines two routes via `react-router-dom`:
- `/` — `frontend/src/pages/Landing.tsx`, the marketing/pitch page (hero, "how it works", "Try it" CTA).
- `/app` — `frontend/src/pages/AppPage.tsx`, the actual tool.

Landing and app are kept as distinct pages/components/files in the same build and deploy — not separate directories or deployments.

## Design system

`DESIGN.md` at the repo root documents the brand's colors, typography,
spacing, motion, and component patterns, extracted from the landing page
(`frontend/src/pages/Landing.tsx` + `Landing.css`), which is currently the
only on-brand surface. It also tracks which surfaces (`/app`, `mobile`) are
still out of sync and what needs to change to bring them in line. Consult it
before styling any new UI so surfaces stay visually consistent, and update it
if the design system itself changes.

## Status

`backend/index.ts` exposes `GET /api/health` plus four Gemini-backed POST routes, all returning schema-constrained JSON in AUD: `/api/device` (legacy two-photo appraisal), `/api/preview` (photos → model/RAM/storage/condition/description/resale range), `/api/estimate` (edited form fields → recalculated resale range), and `/api/recommend` (form fields → fix/sell/tradeIn/donate/recycle blurbs + one recommended pick). `frontend` has a landing page and an app page wired up as described above; `AppPage.jsx` currently reuses an old Gemini chat example as a placeholder. `mobile` implements the full flow: scan (front/back + optional About-screen photo, confirm/retake) → preview sheet (skeleton while analyzing, auto-filled editable form, debounced re-estimation) → recommendation view (five swipeable cards, AI pick badged).
