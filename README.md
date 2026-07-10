# hackathon

Backend (Express + Google Gemini) and frontend (React + Vite) scaffold.

## Tech stack

- **Frontend**: React 19, Vite, plain JavaScript (JSX), `react-router-dom`
- **Backend**: Node.js (ESM), Express 5
- **AI**: Google Gemini (`gemini-2.5-flash`) via the `@google/genai` SDK
- **Other**: `dotenv` (env config), `cors` (cross-origin requests), `nodemon` (backend dev auto-restart)

## Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `GEMINI_API_KEY` to your key. Then start the server:

```bash
npm run dev
```

The server runs on `http://localhost:3001` by default. `GET /api/health` returns `{ "status": "ok" }`, and `POST /api/chat` with a JSON body `{ "prompt": "..." }` returns a Gemini-generated response.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server prints its local URL (typically `http://localhost:5173`).

The app has two routes, both served from the same build:

- `/` — landing page (`frontend/src/pages/Landing.jsx`)
- `/app` — the tool itself (`frontend/src/pages/AppPage.jsx`)

## Linting

Each app lints independently:

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

A GitHub Actions workflow (`.github/workflows/lint.yml`) runs both on every push to `main` and on pull requests.

## Notes

- Each app has its own `package.json` — install and run them independently, there's no root-level install step.
- `.env` files are gitignored; never commit real API keys.
