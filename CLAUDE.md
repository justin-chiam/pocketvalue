# hackathon

Monorepo with a separate `backend` and `frontend`, no shared root package.json. Run commands from within each subdirectory.

## Stack

- **backend**: Node.js (ESM), Express 5, Google Gemini via `@google/genai`, `dotenv`, `cors`. Entry point `backend/index.js`.
- **frontend**: React 19 + Vite, plain JS (`.jsx`, not TypeScript).

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

## Status

Both apps are scaffolds. `backend/index.js` exposes `GET /api/health` and a working `POST /api/chat` example that proxies to Gemini. `frontend/src/App.jsx` is still the unmodified Vite template — replace it with the actual UI.
