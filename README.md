# PocketValue

**Point your camera at any of your old tech and find out what to do with it.** PocketValue turns an old device from guesswork into a plan: photograph the front and back, and it identifies the make and model, rates the physical condition (spotting cracks, scratches, and dents from the photos), estimates the specs, and gives you a realistic resale price range in AUD — auto-filled into an editable report in seconds. From there it weighs five outcomes (fix, resell, trade in, donate, recycle), recommends the best one for your device, and hands you what you need to act on it.

---

## Inspiration

Our inspiration came from having a pile of old devices sitting unused, and wondering how — in a world built around planned obsolescence — we could best adapt to this kind of market.

We also looked into EcoATM, a service that let people resell their devices by feeding them directly into a machine outside grocery stores. But that took a lot of hassle.

What if we could automate that entire process into a single app, instead of driving to a physical machine or researching and comparing across a dozen sources to find the best option? What if it could be done for you in five minutes instead of an hour?

## What it does

Point your camera at any of your old tech and PocketValue automatically identifies the make and model, rates its physical condition by spotting cracks, scratches, and dents, estimates its specs, and gives you a realistic resale price range in AUD — auto-filled into an editable report in seconds.

From there, it weighs five outcomes: **fix, resell, trade in, donate, or recycle.** It recommends the best one for your specific device and hands you exactly what you need to act on it:

- **Repair** — a device-specific repair plan with cost-vs-value-increase breakdowns and guide links.
- **Resell** — ready-to-copy marketplace listing text built from your own photos.
- **Trade in** — for supported Apple devices, the trade-in card pulls trade-in value data directly from Apple to give a real value estimate.
- **Donate & recycle** — nearby drop-off spots based on your location, with directions.

## How we built it

- **Mobile app** — Expo SDK 54 (React Native, TypeScript): the camera capture and preview-form app that drives the whole experience.
- **Backend** — Node.js + Express 5 (TypeScript, run with `tsx`): the API layer that talks to the Agent Platform SDK (we used `gemini-2.5-flash`, `gemini-2.5-flash-lite`, and `gemini-3.5-flash` for inference and search grounding).
- **Landing page** (`frontend/`) — React + Vite: the branded landing page with a live demo section.

The mobile app guides users through front and back photos with confirm/retake steps, downscales them on-device with Expo's `ImageManipulator`, and sends them to the backend via `multer`.

The backend calls Gemini through Vertex AI with a **schema-constrained JSON response**, so we always get structured fields back instead of parsing free-text responses.

The preview form auto-fills the model, RAM and storage, a condition grade (`poor / good / excellent / new`), a short photo-based description, and a resale range — all editable before the user continues. Edited fields are debounced (AI is expensive!) and sent back to Gemini, which returns a short blurb for all five outcomes plus one recommended pick, shown as swipeable cards with the recommended choice always first.

## Challenges we ran into

On the technical side, **AI optimisation was a real constraint.** Initial API calls took around 16–20 seconds just to generate the device report. We realised this was because we were sending uncompressed images that could be 3–5 MB each — a lot of data. We had to compress the images we send so uploads stayed fast without losing the detail Gemini needs to actually spot things like cracks and scratches.

**Estimating resale values accurately was probably our biggest challenge.** Rather than trusting a single model output, we rebuilt our estimation process to spawn a `gemini-2.5-flash-lite` subagent that searches the web with the device's current specs — grounding the estimate in real listings from eBay, Facebook Marketplace, and other authorised second-hand dealers in Australia. That grounded context is then passed to a final model that estimates a price. This was far more accurate than our first iteration.

## Accomplishments we're proud of

- Making our first app.
- Participating in our first hackathon.
- Working well as a team.

## What we learned

- **Aesthetics matter more than we thought.** A resale estimate feels a lot more credible presented as a clean callout than as a plain block of text, and we underestimated how much that mattered until we built it. UX/UI is the same — even if the app worked beautifully internally, if it looked bad, no one would want to use it.
- **How to use Google's Agent Platform SDK for real applications** — from schema-constrained responses that keep outputs structured, to knowing when *not* to trust the model (like trade-in values) and grounding it with real data instead.

## What's next for PocketValue

- Shipping PocketValue as native iOS and Android apps rather than an Expo build, so more people can access it and we can further cut e-waste and over-purchasing of tech.
- An integrated marketplace — or integration with existing ones — including a second-hand marketplace built specifically for the UNSW community.
- Expanding the range of products PocketValue can scan beyond phones, laptops, and iPads to TVs, PCs, consoles, and cameras.
- A database of previous scans, so users can track a device's value over time and we can improve our estimates with real historical data.

---

## Getting started

Monorepo with three independent apps (no root install; run commands inside each directory):

| Directory | What it is |
|---|---|
| `mobile/` | Expo SDK 54 (React Native, TypeScript), the camera capture + preview form app |
| `backend/` | Node.js + Express 5 (TypeScript, run with `tsx`), API that calls Gemini via Vertex AI |
| `frontend/` | React 19 + Vite, landing page (`/`) only |

### The pipeline

1. **Snap** — the mobile app guides you through front and back photos (plus an optional shot of the Settings › About screen for exact model/storage detection), with confirm/retake at each step.
2. **Analyse** — photos are downscaled on-device and sent to the backend, which calls Gemini through Vertex AI with a schema-constrained JSON response in AUD.
3. **Review** — the app shows a preview form auto-filled with model, RAM/storage, condition (`new / excellent / good / poor`), a short visible-condition description, and an estimated resale range, all editable before you continue.
4. **Recommend** — edited fields are sent to Gemini, which returns a blurb for all five outcomes plus one recommended pick, shown as swipeable cards with the AI's choice badged first. Trade-in value is computed locally against Apple's published trade-in tables rather than by Gemini.
5. **Act** — tapping a card opens a full detail sheet for that outcome. **Fix** shows a repair plan (per-fix steps, a guide link, and DIY/professional cost vs. resale-value-increase ranges), **resell** shows ready-to-copy marketplace listing text with your photos, and **donate**/**recycle** use your device location to surface real nearby drop-off spots with directions.

### Backend setup

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

### Mobile setup

```bash
cd mobile
npm i
npx expo start
```

Scan the QR code with Expo Go on your phone. The app derives the backend host from the Metro bundle and assumes the API runs on port 3001 of the same machine (phone and laptop must share a Wi-Fi network). Set `EXPO_PUBLIC_API_URL` to point elsewhere, for example `http://192.168.1.20:3001`.

The mobile flow is: capture front/back photos and optionally an About-screen photo, confirm or retake each photo, review and edit the AI-filled preview, then swipe through five recommendation cards (fix / resell / trade in / donate / recycle, AI pick badged). Preview edits debounce calls to `/api/estimate` before recommendations are requested. Trade-in value is looked up locally against Apple's published trade-in tables (`mobile/data/*_tradein.json`), not via Gemini. Tapping fix, resell, donate, or recycle opens a full-screen detail sheet: fix shows a cost/value-increase breakdown per repair with guide links, resell shows copyable marketplace listing text, and donate/recycle request device location permission to fetch real nearby spots from the backend.

### Landing page setup

```bash
cd frontend
npm i
npm run dev
```

The Vite app exposes the branded landing page at `/`. There is no web app workflow; the complete photo-to-recommendation flow lives in the mobile app.

### Linting & CI

Run `npm run lint` in `backend/` and `frontend/`. Typecheck with `npm run typecheck` in `backend/` and `frontend/`, and `npx tsc --noEmit` in `mobile/`. A GitHub Actions workflow (`.github/workflows/lint.yml`) lints backend and frontend on pushes to `main` and on pull requests.

### Acknowledgements

Made with ❤️ by Justin, Benji, and Lemuel

## Links
Devpost -> https://devpost.com/software/pocketvalue
Website -> https://pocketvalue.vercel.app
