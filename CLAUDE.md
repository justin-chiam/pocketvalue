# hackathon

Monorepo with a separate `backend` and `frontend`, no shared root package.json. Run commands from within each subdirectory.

## Stack

- **backend**: Node.js (ESM), Express 5, Google Gemini via `@google/genai`, `dotenv`, `cors`. Entry point `backend/index.js`.
- **frontend**: React 19 + Vite, plain JS (`.jsx`, not TypeScript), `react-router-dom` for client-side routing.

## Commands

Backend (from `backend/`):
- `npm run dev` — start with nodemon (auto-restart)
- `npm start` — start with node
- `npm run lint` — ESLint

Frontend (from `frontend/`):
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint

## CI

`.github/workflows/lint.yml` runs `npm run lint` for both `backend` and `frontend` on push to `main` and on every pull request.

## Environment

Backend requires a `.env` file (see `backend/.env.example`) with `GEMINI_API_KEY`. Never commit `.env` — it's gitignored at the repo root.

## Gemini API usage

Use the `@google/genai` SDK, not the older `@google/generative-ai` package:

```js
import { GoogleGenAI } from '@google/genai'
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'prompt text',
})
response.text
```

## Frontend routes

`frontend/src/App.jsx` defines two routes via `react-router-dom`:
- `/` — `frontend/src/pages/Landing.jsx`, the marketing/pitch page (hero, "how it works", "Try it" CTA).
- `/app` — `frontend/src/pages/AppPage.jsx`, the actual tool.

Landing and app are kept as distinct pages/components/files in the same build and deploy — not separate directories or deployments.

## Status

`backend/index.js` exposes `GET /api/health` and a working `POST /api/chat` example that proxies to Gemini. `frontend` has a landing page and an app page wired up as described above; `AppPage.jsx` currently reuses the Gemini chat example as a placeholder for the real photograph-a-device tool flow.
