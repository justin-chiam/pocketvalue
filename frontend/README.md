# PocketValue landing page

This is the React 19 + Vite landing page for PocketValue. It is a separate app
from `backend/` and `mobile`; install dependencies and run commands from this
directory. The product workflow is mobile-only.

## Routes

- `/` — branded landing page and product pitch.

## Development

```bash
npm install
npm run dev
```

The landing page does not call the backend. The device-photo workflow is
implemented in `mobile/`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```
