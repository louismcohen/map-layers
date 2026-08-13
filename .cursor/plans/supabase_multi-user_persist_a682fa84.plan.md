---
name: Supabase multi-user persist
overview: Replace IndexedDB with Supabase Auth and relational Postgres. The browser talks to PostgREST with the user's JWT; RLS is the security boundary. A mapper converts table rows to the in-memory domain Document (and back). Zustand stays as UI + working copy, without persist middleware.
todos:
    - id: supabase-schema
      content: Migrations + RLS; 3-letter id prefixes (wsp/lyr/plc/iso) with CHECK constraints
      status: pending
    - id: auth-ui
      content: Supabase client (publishable key), magic-link login, getClaims gate, sidebar logout
      status: pending
    - id: replace-idb
      content: Row mapper + hydrate/sync; debounce upserts; never delete-all on empty; logout must not save
      status: pending
    - id: env-docs-deploy
      content: Env example, README + Architecture; notes for static deploy and API key referrer restrict
      status: pending
isProject: false
---

# Server-backed persist (Supabase, relational)

IndexedDB is not the store. There is also **no custom backend**. The API is Supabase PostgREST over Postgres tables. The browser calls it with the signed-in user's JWT; **RLS** decides what rows exist for that request.

**Docs source of truth:** do not re-learn from model training data. Before implementing, fetch [changelog.md](https://supabase.com/changelog.md) (scan `breaking-change`), look up topics via MCP `search_docs` or docs `.md` URLs, and apply the local Supabase + Postgres best-practices skills. Pin Supabase package versions (no floating `^`).

```mermaid
flowchart LR
  UI[React] --> Store[Zustand working copy]
  Store --> Domain[packages/domain Document]
  Store --> Mapper[row mapper]
  Mapper -->|"supabase.from tables"| REST[PostgREST]
  REST --> RLS[RLS auth.uid]
  RLS --> PG[(Postgres)]
  Auth[Auth JWT] --> REST
```

## What “document” means

Two different things; do not mix them:

- **Domain `Document`** ([`packages/domain`](packages/domain) `types.ts`) — the in-memory tree the UI already uses: `rootChildren`, `nodes`, `defaultPlaceColor`. Zustand holds this working copy. It is not stored as one JSON value.
- **SQL `workspaces`** — one **header row per user** (`user_id`, `default_place_color`, `updated_at`). Layers, places, isochrones, and `tree_nodes` hang off `workspace_id`. This is not a document blob.

The old Architecture name “document” meant the whole map project (Figma-style). In Postgres that project is a **workspace**.

## Why Zustand still exists (`documentStore`)

[`apps/web/src/store/documentStore.ts`](apps/web/src/store/documentStore.ts) is not a database. It is the **client working copy**:

- domain `Document` (`nodes`, `rootChildren`) so `flattenTree`, `resolveDropTarget`, and mutations stay pure and unit-tested
- UI ephemera: selection, search preview, toasts

Drop Zustand **persist / idb-keyval**. After each domain mutation, debounce a sync to Postgres. Load on sign-in. Logout clears local state and **does not write**.

No `authStore`. Session lives in supabase-js (`useAuth`). The filename stays `documentStore` because the domain type is still `Document`; we are not wrapping a JSON blob anymore.

## Transform: DB rows ↔ domain (not `documentDb`)

No generic “document database” module. A **`lib/workspace/`** cluster next to the Supabase client (same pattern as [`lib/isochrone/`](apps/web/src/lib/isochrone/)): pure mapper in `mapper.ts`, PostgREST in `api.ts`. Public seam is [`lib/workspace/index.ts`](apps/web/src/lib/workspace/index.ts) (`loadWorkspace` / `saveWorkspace` / `ensureWorkspace`).

**Load (PostgREST → domain)**

1. `workspaces` row for `auth.uid()` (create empty workspace if none)
2. `select` `layers`, `places`, `isochrones`, `tree_nodes` where `workspace_id = …`
3. `rowsToDocument`:
    - each layer/place/isochrone row → `DocNode` (`lng`/`lat` → `coordinates`, `source_provider`/`provider_id` → `sourceProvider`/`providerId`, `origin_place_id` → `originPlaceId`)
    - `tree_nodes` ordered by `parent_id`, `sort_index` → `rootChildren` and each layer’s `children`

**Save (domain → PostgREST)**

1. `documentToRows` splits `Document` into layer / place / isochrone / `tree_nodes` rows
2. Upsert those rows keyed by `id`
3. Delete DB rows whose ids are no longer in the tree
4. Abort if that delete set would wipe a non-empty workspace (empty-client guard)

Isochrone `geojson` / `contours` stay JSONB **columns** on the isochrone row.

The UI never thinks in SQL. Domain never imports `supabase-js`. Only `lib/workspace/` (mapper + api) and `useWorkspaceSync` know about tables.

## Secure access from the client

The Vite app uses `@supabase/supabase-js` with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable) — **this key is public**. Anyone can extract it from the bundle. That is expected.

What actually protects data:

1. **Sign-in** (magic link) issues a user JWT. `supabase-js` sends `Authorization: Bearer <jwt>` on every table request.
2. **RLS** on every table: a row is visible/writable only if it belongs to a `workspaces` row where `user_id = auth.uid()`. Anon with no session gets zero rows. User A cannot `select`/`update`/`delete` user B’s layers.
3. **Grants**: `anon` has no useful table rights (or only `insert` into nothing that RLS allows). `authenticated` has CRUD **subject to RLS**.
4. **Never** put `service_role` in the web app. That key bypasses RLS.
5. UPDATE policies require a matching SELECT policy (Postgres RLS).

So “securely accessing Supabase from the client” means: **public anon key + user JWT + RLS**, not a hidden server connection string.

Mapbox/Google keys stay `VITE_*` for this slice (restrict by HTTP referrer). They are unrelated to Postgres.

## Schema (one workspace per user)

`workspaces`: `id`, `user_id` unique → `auth.users`, `default_place_color`, `updated_at`

- `layers`: `id`, `workspace_id`, `name`, `visible`, `color`, `maki`, `collapsed`
- `places`: `id`, `workspace_id`, `name`, `source_provider` (`google`|`mapbox`), `provider_id`, `lng`, `lat`, `address`, `feature_type`, `maki`, `visible` — unique `(workspace_id, source_provider, provider_id)`
- `isochrones`: `id`, `workspace_id`, `name`, `center_lng`, `center_lat`, `profile`, `metric`, `contours` jsonb, `geojson` jsonb, `color`, `visible`, `origin_place_id` nullable FK → `places(id)` on delete cascade
- `tree_nodes`: `workspace_id`, `node_id`, `kind`, `parent_id` nullable, `sort_index` — mixed sibling order

`tree_nodes.node_id` is polymorphic (`kind` says layer / place / isochrone). `parent_id` is null at root, otherwise a layer id.

```mermaid
erDiagram
  auth_users ||--|| workspaces : owns
  workspaces ||--o{ layers : contains
  workspaces ||--o{ places : contains
  workspaces ||--o{ isochrones : contains
  workspaces ||--o{ tree_nodes : orders
  layers ||--o{ tree_nodes : "parent_when_nested"
  places ||--o{ isochrones : "originPlace"

  auth_users {
    uuid id PK
    string email
  }

  workspaces {
    text id PK
    uuid user_id UK_FK
    string default_place_color
    timestamptz updated_at
  }

  layers {
    text id PK
    text workspace_id FK
    string name
    boolean visible
    string color
    string maki
    boolean collapsed
  }

  places {
    text id PK
    text workspace_id FK
    string name
    string source_provider
    string provider_id
    float lng
    float lat
    string address
    string feature_type
    string maki
    boolean visible
  }

  isochrones {
    text id PK
    text workspace_id FK
    text origin_place_id FK
    string name
    float center_lng
    float center_lat
    string profile
    string metric
    jsonb contours
    jsonb geojson
    string color
    boolean visible
  }

  tree_nodes {
    text workspace_id FK
    text node_id
    string kind
    text parent_id
    int sort_index
  }
```

First login: insert an empty `workspaces` row (no tree rows).

## IDs

The **client** generates ids in [`createId`](packages/domain/src/document.ts): `` `${prefix}_${crypto.randomUUID()}` ``. Postgres does not assign them; it CHECKs the prefix. The mapper never mints a second id. (`auth.users.id` is still created by Supabase Auth.)

- `wsp_` — workspaces (once, on first login, before insert)
- `lyr_` — layers (on create)
- `plc_` — places (on add)
- `iso_` — isochrones (on add)

`tree_nodes` has no id: `node_id` is the child’s id; `parent_id` is null or a `lyr_` id. `origin_place_id` is the place’s `plc_` id.

## App file layout

Domain still never imports `supabase-js`. UI still never calls `supabase.from`.

```mermaid
flowchart TB
  subgraph ui [components and hooks]
    AuthGate
    LoginScreen
    AccountMenu
    useAuth
    useWorkspaceSync
  end
  subgraph store [store]
    documentStore
  end
  subgraph io [lib]
    supabaseClient[supabase.ts]
    mapper[workspace/mapper.ts]
    api[workspace/api.ts]
  end
  subgraph sql [repo root]
    migrations[supabase/migrations]
  end
  AuthGate --> useAuth
  useAuth --> supabaseClient
  AccountMenu --> useAuth
  useWorkspaceSync --> documentStore
  useWorkspaceSync --> api
  documentStore --> mapper
  api --> mapper
  api --> supabaseClient
  supabaseClient --> migrations
```

### New files (`apps/web`)

```
apps/web/src/
  lib/
    supabase.ts                         # browser client (anon key, PKCE)
    database.types.ts                   # generated PostgREST types
    workspace/
      types.ts                          # row DTOs used by mapper (thin wrappers over generated)
      mapper.ts                         # rowsToDocument / documentToRows (pure)
      mapper.test.ts                    # round-trip + tree_nodes order
      api.ts                            # loadWorkspace / saveWorkspace / ensureWorkspace
      index.ts                          # re-export load/save only
  hooks/
    useAuth.ts                          # session, magic-link, signOut, onAuthStateChange
    useWorkspaceSync.ts                 # hydrate on sign-in; debounce save; skip on logout
  components/
    auth/
      AuthGate.tsx                      # no session → LoginScreen; loading → existing spinner
      LoginScreen.tsx                   # email + magic link
      AccountMenu.tsx                   # sidebar email + logout
```

- [`lib/supabase.ts`](apps/web/src/lib/supabase.ts) — `supabase` singleton via `createClient<Database>(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` with `auth.flowType: 'pkce'`, `detectSessionInUrl: true`. Session JWT stays in supabase-js storage (not Zustand). Never `service_role`.
- [`lib/database.types.ts`](apps/web/src/lib/database.types.ts) — output of `supabase gen types typescript`. Commit it. Mapper/api import `Tables<'layers'>` etc. from here.
- [`lib/workspace/types.ts`](apps/web/src/lib/workspace/types.ts) — `WorkspaceSnapshot` (`workspace` + `layers` + `places` + `isochrones` + `tree_nodes`). Optional camelCase aliases if generated names are too noisy.
- [`lib/workspace/mapper.ts`](apps/web/src/lib/workspace/mapper.ts) — `rowsToDocument(snapshot) → Document`; `documentToRows(doc, workspaceId) → snapshot`. Column map: `lng`/`lat` ↔ `coordinates`; `source_provider`/`provider_id` ↔ `sourceProvider`/`providerId`; `origin_place_id` ↔ `originPlaceId`. `tree_nodes` ordered by `parent_id`, `sort_index` → `rootChildren` / layer `children`. Does **not** mint ids. Does **not** import `supabase-js`.
- [`lib/workspace/api.ts`](apps/web/src/lib/workspace/api.ts) — `ensureWorkspace()` — select by `auth.uid()`, else insert `{ id: createId('wsp'), user_id }` with empty tree. `loadWorkspace()` — fetch four child tables, `rowsToDocument`. `saveWorkspace(doc, workspaceId)` — `documentToRows`, upsert by `id`, delete missing ids, **abort if delete set would wipe a non-empty workspace**. Update `workspaces.updated_at`.
- [`lib/workspace/index.ts`](apps/web/src/lib/workspace/index.ts) — public seam: `loadWorkspace`, `saveWorkspace`, `ensureWorkspace`. Store/hooks import this, not table names.
- [`hooks/useAuth.ts`](apps/web/src/hooks/useAuth.ts) — `session`, `user`, `loading`; `signInWithOtp(email)`; `signOut()`; subscribe `onAuthStateChange`.
- [`hooks/useWorkspaceSync.ts`](apps/web/src/hooks/useWorkspaceSync.ts) — on `SIGNED_IN`: `loadWorkspace` → `hydrateDocument`. Subscribe to `document` (not UI ephemera); debounce flush → `saveWorkspace`. On `SIGNED_OUT`: cancel timer, `resetLocal()`, **do not write**.
- [`components/auth/AuthGate.tsx`](apps/web/src/components/auth/AuthGate.tsx) — gate around today’s chrome: unauthenticated users never see map/store data.
- [`components/auth/LoginScreen.tsx`](apps/web/src/components/auth/LoginScreen.tsx) — magic-link form (existing shadcn `Input` / `Button`).
- [`components/auth/AccountMenu.tsx`](apps/web/src/components/auth/AccountMenu.tsx) — compact email + Log out for the sidebar footer.

### New files (repo root — not a package)

```
supabase/
  config.toml
  migrations/
    <timestamp>_init.sql              # tables, CHECKs, FKs, RLS, GRANTs
```

One migration is enough: `workspaces`, `layers`, `places`, `isochrones`, `tree_nodes`; id prefix CHECKs (`wsp_` / `lyr_` / `plc_` / `iso_`); RLS `user_id = auth.uid()` via workspace ownership; `authenticated` CRUD subject to RLS; `anon` no useful grants.

`.gitignore`: add `.supabase/` (CLI temp). Do not commit secrets.

### Touched existing files (no new modules)

- [`apps/web/src/store/documentStore.ts`](apps/web/src/store/documentStore.ts) — drop `persist`, `idb-keyval`, IDB empty-guard, IndexedDB migrate v2–v4. Keep `document` + UI ephemera. Add `workspaceId: string | null`, `hydrateDocument({ document, workspaceId })`, `resetLocal()` (empty doc, clear selection/preview, `hydrated: false`). Mutations stay domain wrappers; they do **not** call PostgREST (`useWorkspaceSync` watches `document`).
- [`apps/web/src/App.tsx`](apps/web/src/App.tsx) — wrap with `AuthGate`; mount `useWorkspaceSync`; drop `useDocumentStore.persist.onFinishHydration`.
- [`apps/web/src/components/AppSidebar.tsx`](apps/web/src/components/AppSidebar.tsx) — render `AccountMenu` at the bottom of the floating sidebar (search / layers unchanged).
- [`apps/web/src/vite-env.d.ts`](apps/web/src/vite-env.d.ts) + [`apps/web/.env.example`](apps/web/.env.example) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- [`apps/web/package.json`](apps/web/package.json) — add `@supabase/supabase-js`; remove `idb-keyval`; add `vitest` for mapper tests (domain already has it).
- [`packages/domain/src/document.ts`](packages/domain/src/document.ts) — `createId(prefix: 'wsp' | 'lyr' | 'plc' | 'iso')` (today: `'layer'` / `'place'` / `'isochrone'`).
- [`packages/domain/src/mutations.ts`](packages/domain/src/mutations.ts) — `createId('lyr'|'plc'|'iso')`. Workspace id is minted only in `ensureWorkspace`.
- [`packages/domain/src/index.ts`](packages/domain/src/index.ts) + [`domain.test.ts`](packages/domain/src/domain.test.ts) — export prefix type; assert prefixes.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) + [`README.md`](README.md) — Zustand = working copy; mapper = I/O seam; IndexedDB gone; env names only.

Leave IndexedDB migrate helpers in domain (`migratePlaceVisibility`, etc.) unused by the store; Postgres is a fresh schema, not a blob migrate.

### What does not get a file

- No `packages/api`, Edge Functions, or `documentDb.ts`.
- No `supabase.from(...)` in components or domain.
- No Zustand persist middleware and no IDB key `map-layers:v1`.
- Auth JWT is not a second document blob — supabase-js owns the session.

### Sync data flow

```mermaid
sequenceDiagram
  participant UI
  participant Store
  participant Sync as useWorkspaceSync
  participant Api as workspace/api
  participant PG as PostgREST plus RLS

  UI->>Store: domain mutation
  Sync->>Store: watch document
  Sync->>Api: debounced saveWorkspace
  Api->>PG: upsert plus delete missing ids
  Note over Sync: signOut cancels timer and skips save
```

## Deploy

Static Vite build (Vercel or Cloudflare Pages) with the four `VITE_*` vars. Restrict Google Places + Mapbox tokens to production (and local).

## Architecture

Update [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Zustand is the working copy; Postgres is source of truth; mapper is the I/O boundary (so a later BFF is an adapter swap); RLS + JWT; IndexedDB removed; import/export, realtime, multi-document deferred.

## When a backend is actually needed

Not for “Postgres + login + my layers.” Supabase already is that server (Auth + PostgREST + RLS). A static SPA is enough for this plan.

Add **Edge Functions or a small API** when the browser is the wrong place to run the work:

- **Secrets** — Mapbox/Google keys in `VITE_*` are visible. Referrer restriction is a speed bump. Hide them when you care about quota theft: proxy Places + Isochrone server-side.
- **Rules RLS cannot express cleanly** — sharing a tree, invite links, “editor vs viewer,” billing, rate limits on expensive APIs.
- **Privileged writes** — anything that must use `service_role` (never in the client). That belongs in a function you control.
- **Multi-step transactions** beyond “upsert these rows” — a Postgres `SECURITY INVOKER` RPC can still avoid a Node server; a BFF is for logic that is not SQL.

Until then: no Express/Lambda app. Postgres RPC or one Edge Function is the next step, not a general backend.

## Path to a backend later

Yes, if we keep one seam: **UI and `packages/domain` never call PostgREST**. Only `lib/workspace/` (`loadWorkspace` / `saveWorkspace`) and today’s search/isochrone `lib/` adapters talk to the network.

That is the same layering Architecture already has (`lib/` = I/O adapters). Adding a backend is swapping adapters, not rewriting the tree or the sidebar.

```mermaid
flowchart LR
  Domain[packages/domain]
  Store[Zustand]
  Mapper[lib/workspace]
  Search[googlePlacesSearch]
  Iso[isochrone provider]
  Domain --> Store
  Store --> Mapper
  Store --> Search
  Store --> Iso
  Mapper -->|"now: supabase.from"| PG[PostgREST plus RLS]
  Mapper -->|"later: same functions"| API[Edge or BFF]
  Search -->|"later"| API
  Iso -->|"later"| API
  API --> PG
```

Concrete order when it becomes necessary:

1. **Edge Functions for secrets** — Places + Isochrone use a server Mapbox/Google key. Client `lib/` functions change URL from Google/Mapbox to `/functions/v1/...`. Schema and mapper unchanged.
2. **Postgres RPC** — still no Node app. Use for transactions or sharing rules that are SQL.
3. **BFF** — `lib/workspace` `loadWorkspace` / `saveWorkspace` call _your_ HTTP API with the user JWT; the server uses `service_role` or the user JWT against Postgres. Tables and RLS stay. Zustand and domain stay.

What would block this path: sprinkling `supabase.from('places')` through components, or moving domain mutations into SQL-only with no in-memory `Document`. We will not do that in this plan.

## Out of scope (this plan)

- A custom API/BFF in front of Supabase
- Per-keystroke SQL (still debounce a tree flush)
- Realtime / multi-tab merge
- Sharing a tree between users
- Proxying Mapbox/Google through Edge Functions
