# PocketValue

**Point your camera at any of your old tech and find out what to do with it.** PocketValue turns an old device from guesswork into a plan: take a photo of the front and back, and Gemini identifies the make and model, rates its physical condition (spotting cracks, scratches, and dents from the photos), estimates its specs, and gives you a realistic resale price range, auto-filled into an editable form in seconds. From there it weighs five outcomes (fix, resell, trade in, donate, recycle), recommends the best one for your device, and hands you what you need to act on it: a device-specific repair plan with cost/value breakdowns and guide links, copyable marketplace listing text, or real nearby donation and recycling spots. No typing model numbers, no browsing price guides.

## How it works

1. **Snap**: the mobile app guides you through front and back photos (plus an optional shot of the Settings › About screen for exact model/storage detection), with confirm/retake at each step.
2. **Analyse**: photos are downscaled on-device and sent to the backend, which calls Gemini 2.5 Flash through Vertex AI with a schema-constrained JSON response in Australian dollars (AUD).
3. **Review**: the app shows a preview form auto-filled with model, RAM/storage, condition (`new / excellent / good / poor`), a short visible-condition description, and an estimated resale range, all editable before you continue.
4. **Recommend**: edited fields are sent to Gemini, which returns a blurb for all five outcomes (fix, sell, trade in, donate, recycle) plus one recommended pick, shown as swipeable cards with the AI's choice badged first. Trade-in value is computed locally against Apple's published trade-in tables rather than by Gemini.
5. **Act**: tapping a card opens a full detail sheet for that outcome. **Fix** shows a repair plan (per-fix steps, a guide link, and DIY/professional cost vs. resale-value-increase ranges), **resell** shows ready-to-copy marketplace listing text with your photos, and **donate**/**recycle** use your device location to surface real nearby drop-off spots with directions.

## Repo layout

Monorepo with three independent apps (no root install; run commands inside each directory):

| Directory | What it is |
|---|---|
| `mobile/` | Expo SDK 54 (React Native, TypeScript), the camera capture + preview form app |
| `backend/` | Node.js + Express 5 (TypeScript, run with `tsx`), API that calls Gemini via Vertex AI |
| `frontend/` | React 19 + Vite, landing page (`/`) only |

## Backend setup

Gemini is called strictly through **Vertex AI** (no API-key mode). You need a GCP project with the `aiplatform.googleapis.com` API enabled and a service account with the *Vertex AI User* role.

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env` (`GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`) and drop your service-account key at `backend/keys/service-account.json` (gitignored, never commit keys). Then:

```bash
npm run dev
```

Runs on `http://localhost:3001` (or the `PORT` you provide). Endpoints:

- `GET /api/health`: liveness check
- `POST /api/preview`: multipart `front` + `back` images (optional `settings`); returns `{ deviceDetected, model, resaleValueAud: { low, high }, ramGb, storageGb, condition, description }`. `front` and `back` are required; each image is limited to 15 MB. A request with no detectable device returns `422`.
- `POST /api/estimate`: JSON form fields `{ model, ramGb, storageGb, batteryPct, condition }`; returns `{ low, high }` in AUD.
- `POST /api/recommend`: JSON form fields `{ model, ramGb, storageGb, batteryPct, condition, description, resaleLow, resaleHigh }`; returns five action blurbs (`fix`, `sell`, `tradeIn`, `donate`, `recycle`), a device-specific `repairPlan` (fixes with steps, a repair-guide search, and DIY/professional cost + resale-value-increase ranges in AUD), and one `recommended` action.
- `POST /api/donate-locations`: JSON `{ model, location }`; grounds a Gemini search on real nearby donation spots (charities, op shops, e-waste drop-offs) and returns `{ intro, locations: [{ name, address, note, mapsUrl }] }`.
- `POST /api/recycle-locations`: JSON `{ model, location }`; same pattern as above for nearby e-waste recycling centres.
- `POST /api/device`: legacy two-photo appraisal. Accepts the same multipart fields as `/api/preview` and returns `{ make, model, condition, resaleValueAud: { low, high } }`.

All Gemini-backed endpoints return `400` for invalid input and `500` when the Gemini request fails. The backend uses Application Default Credentials through `GOOGLE_APPLICATION_CREDENTIALS`; it does not use an API key.

## Mobile setup

```bash
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go on your phone. The app derives the backend host from the Metro bundle and assumes the API runs on port 3001 of the same machine (phone and laptop must share a Wi-Fi network). Set `EXPO_PUBLIC_API_URL` to point elsewhere, for example `http://192.168.1.20:3001`.

The mobile flow is: capture front/back photos and optionally an About-screen photo, confirm or retake each photo, review and edit the AI-filled preview, then swipe through five recommendation cards (fix / resell / trade in / donate / recycle, AI pick badged). Preview edits debounce calls to `/api/estimate` before recommendations are requested. Trade-in value is looked up locally against Apple's published trade-in tables (`mobile/data/*_tradein.json`), not via Gemini. Tapping fix, resell, donate, or recycle opens a full-screen detail sheet: fix shows a cost/value-increase breakdown per repair with guide links, resell shows copyable marketplace listing text, and donate/recycle request device location permission to fetch real nearby spots from the backend.

## Landing page setup

```bash
cd frontend
npm install
npm run dev
```

The Vite app exposes the branded landing page at `/`. There is no web app workflow; the complete photo-to-recommendation flow lives in the mobile app.

## Linting & CI

Run `npm run lint` in `backend/` and `frontend/`. Typecheck with `npm run typecheck` in `backend/` and `frontend/`, and `npx tsc --noEmit` in `mobile/`. A GitHub Actions workflow (`.github/workflows/lint.yml`) lints backend and frontend on pushes to `main` and on pull requests.
