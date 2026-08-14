# Ambit

Solo, local-first layered map of places. Search Google Places, organize them in nested Figma-like layers, show/hide layers, color pins by layer, and draw walk/bike/drive isochrones.

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
# set VITE_MAPBOX_ACCESS_TOKEN, VITE_GOOGLE_MAPS_API_KEY,
# VITE_SUPABASE_URL, and VITE_SUPABASE_PUBLISHABLE_KEY in apps/web/.env
# Google key: enable Places API (New); restrict by HTTP referrer
# Local Supabase: `supabase start` then copy Project URL + Publishable key from `supabase status`
pnpm dev
```

Open the Vite URL (default `http://localhost:5173`). Sign in with a magic link or email+password (local Auth emails, including password reset, are caught by Mailpit at `http://127.0.0.1:54324` — it ships with `supabase start`).

## Docs

Product and architecture live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Agent guidance: [`AGENTS.md`](AGENTS.md).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start web app |
| `pnpm test` | Run domain tests |
| `pnpm lint` | Biome check |
| `pnpm typecheck` | Typecheck packages |
