# Ambit

Signed-in web app: full-bleed Mapbox map with a floating sidebar. Search Google Places, organize them in nested Figma-like layers, show/hide layers, color pins by layer, and draw walk/bike/drive isochrones. Each user has one Postgres workspace (Supabase Auth + PostgREST).

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
# fill the four VITE_* vars (comments in .env.example)
# Local Supabase: `supabase start` then copy API URL + Publishable key from `supabase status`
pnpm dev
```

Open the Vite URL (default `http://localhost:5173`). Sign in with a magic link or email+password (local Auth emails, including password reset, are caught by Mailpit at `http://127.0.0.1:54324` — it ships with `supabase start`).

Restrict the Mapbox token (URL restrictions) and Google key (HTTP referrers) to `http://localhost:5173` and `http://127.0.0.1:5173` for local, plus the production origin. Enable **Places API (New)** on the Google key. Never put a Supabase `service_role` key in the web app.

## Deploy

Static Vite SPA — no app Node server. `pnpm build` emits `apps/web/dist`. Host on Vercel, Cloudflare Pages, Railway, or any static host.

1. Set the four `VITE_*` vars on the host (`VITE_MAPBOX_ACCESS_TOKEN`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Vite inlines them at **build** time, so a value change needs a rebuild.
2. Point the app at a **hosted** Supabase project (not local). Apply `supabase/migrations`. In the dashboard, set **Site URL** and **Redirect URLs** to the production origin (exact URL; same origin as magic-link `emailRedirectTo`).
3. Restrict Mapbox URL + Google HTTP referrer to that production origin (keep the local origins if you reuse the same keys). Do not set `Referrer-Policy` to `no-referrer` or `same-origin` — restricted keys need a `Referer` header.

Railway: `railway.toml` runs `pnpm build` then `pnpm start` (serves `apps/web/dist` on `$PORT`). Do not use `vite` / `pnpm dev` as the start command. Keep the service root as the repo.

## Docs

Product and architecture live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Agent guidance: [`AGENTS.md`](AGENTS.md).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start web app |
| `pnpm build` | Typecheck + Vite production build (`apps/web/dist`) |
| `pnpm start` | Serve `apps/web/dist` (production; Railway) |
| `pnpm test` | Run domain tests |
| `pnpm lint` | Biome check |
| `pnpm typecheck` | Typecheck packages |
