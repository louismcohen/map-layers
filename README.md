# Map Layers

Solo, local-first layered map of places. Search Mapbox places, organize them in nested Figma-like layers, show/hide layers, and color pins by layer.

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
# set VITE_MAPBOX_ACCESS_TOKEN in apps/web/.env
pnpm dev
```

Open the Vite URL (default `http://localhost:5173`).

## Docs

Product and architecture live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Agent guidance: [`AGENTS.md`](AGENTS.md).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start web app |
| `pnpm test` | Run domain tests |
| `pnpm lint` | Biome check |
| `pnpm typecheck` | Typecheck packages |
