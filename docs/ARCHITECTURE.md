# Map Layers — System, Architecture & UI Design

## Status

- Last updated: 2026-08-09
- Implemented: living docs; monorepo; domain (+ `resolveDropTarget`); Zustand/IndexedDB; Mapbox (LA default + geolocation); layers panel (**combined color + optional Maki icon** via `LayerStylePicker` + **react-color** `GithubPicker`; **whole-row** drag reorder; Phosphor icons for caret expand / eye visibility); **filled** pins with Maki glyphs (place `maki`, overridable by nearest ancestor layer `maki`); Search Box with on-map preview pins (random color reused for new layers; **clear** control on search input); **isochrones** (time + distance; walk/bike/drive; user-chosen minutes/miles; create from search-row icon or place `…` menu; GeoJSON `Source`/`Layer`; provider-isolated Mapbox client with **denoise + generalize + Turf polygonSmooth**); fit bounds (places/layers only); modals/toasts; UI orchestration hooks (`usePlaceSearch`, `useIsochroneCreate`, `useFlyToUserOnce`) + shared `mapCamera` helpers; **shadcn/ui (base-rhea / taupe, always light)** chrome — **floating `Sidebar`** (`AppSidebar`: search + layers) over full-bleed map, inset offset by `--sidebar-width`
- In progress: none
- Next: optional polish (layer opacity, clustering)
- Deferred: see [Explicitly deferred](#explicitly-deferred)

---

## Product summary

A solo, local-first web app: full-bleed Mapbox map with a left **floating** shadcn sidebar (search + layers). Users search for places, add one/many/all results into nested layers (or the top of the tree), then show/hide layers and assign a layer color that drives all pins under that layer.

**Out of scope (v1):** accounts, sync, import/export, multiplayer.

---

## Stack (locked)

| Layer | Choice |
| --- | --- |
| Monorepo | **pnpm workspaces + Turborepo** |
| App | React 19 + Vite + TypeScript |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) |
| UI | **shadcn/ui** (CLI v4, style **base-rhea**, base color **taupe**, always light `:root` tokens); primitives under `apps/web/src/components/ui` |
| Lint/format | Biome (root config) |
| Map | `mapbox-gl` + `react-map-gl` |
| Map style | `mapbox://styles/louiscohen/cm54miu4700j201qparty6veb` (from yelp-combinator) |
| Token | `VITE_MAPBOX_ACCESS_TOKEN` in `apps/web/.env` |
| State | Zustand + persist to **IndexedDB** (`idb-keyval`) |
| DnD | `@dnd-kit` for layer tree reorder/reparent |
| Motion | `motion` (pin select / panel transitions) |
| Toasts | **sonner** (via shadcn `Toaster`; `pushToast` in the store) |
| Pin glyphs | `@mapbox/maki` (from Search Box `maki`) |
| Color picker | **react-color** (`GithubPicker`) in `LayerStylePicker` |
| App icons | **`@phosphor-icons/react`** (layers/search chrome); shadcn primitives use Hugeicons |
| Search | **Mapbox Search Box API** (see note below) |

### Search API note (important)

Mapbox Geocoding was the original ask. **Geocoding v6 no longer returns POIs** (restaurants, shops, etc.) — only addresses/places in the administrative sense. For a “places” product, v1 will use **[Search Box API](https://docs.mapbox.com/api/search/search-box/)** (`/search/searchbox/v1/...`) with:

- debounce + `proximity` / `bbox` from current map viewport
- session tokens for Suggest → Retrieve
- permanent storage eligibility respected for saved places (Mapbox terms: do not persist temporary geocode-only results without the permanent/storage-allowed path)

If pure address geocoding is needed later, add Geocoding v6 as a second mode behind the same `PlaceSearchProvider` interface.

---

## Monorepo layout

```
map-layers/
  apps/web/                 # Vite React app (the product)
  packages/
    domain/                 # pure TS: tree model, selectors, mutations (no React)
    tsconfig/               # shared TS configs
  docs/
    ARCHITECTURE.md         # this file — primary living app doc
  AGENTS.md
  .cursor/rules/
    architecture-doc.mdc
  biome.json
  package.json
  pnpm-workspace.yaml
  turbo.json
```

- **`packages/domain`**: tree operations, effective visibility/color, DnD drop resolution, IDs — unit-testable without the UI.
- **`apps/web`**: Mapbox UI, Zustand store wiring, search client, pin components adapted from yelp-combinator.

### App layering (`apps/web`)

| Layer | Responsibility |
| --- | --- |
| `packages/domain` | Pure document/tree rules (mutations, selectors, `resolveDropTarget`) |
| `lib/` | I/O adapters (`mapboxSearch`, `isochrone/` provider) and Mapbox camera helpers (`mapCamera`) |
| `store/` | Zustand: document + selection + `searchPreview`; wraps domain; toasts via sonner |
| `hooks/` | React lifecycle + store coordination (`usePlaceSearch`, `useLocation`, camera policies) |
| `components/` | Presentational UI: props/events in, render out (`components/ui` = shadcn primitives) |

No backend package in v1.

---

## Domain model

Flat node map + ordered child ID lists (same pattern as Figma: easy move/reparent without deep immutable clones).

**Discriminated union** so geometry leaf kinds slot in without rewriting the tree:

```ts
type NodeId = string;

type PlaceNode = {
  id: NodeId;
  kind: 'place';
  name: string;
  mapboxId: string; // Search Box feature id
  coordinates: { lng: number; lat: number };
  address?: string;
  featureType?: string; // e.g. poi, address
  maki?: string; // Search Box Maki icon name (e.g. restaurant, cafe)
  raw?: unknown; // trimmed Search Box payload if useful later
};

type IsochroneNode = {
  id: NodeId;
  kind: 'isochrone';
  name: string;
  center: { lng: number; lat: number };
  profile: 'walking' | 'cycling' | 'driving';
  metric: 'time' | 'distance';
  contours: number[]; // minutes or meters (user-chosen single value at create)
  geojson: FeatureCollection; // stored from provider response
  color: string; // used when at root; ignored for paint when under a layer
  visible: boolean; // own toggle; ANDed with ancestor layers when nested
};

type LayerNode = {
  id: NodeId;
  kind: 'layer';
  name: string;
  visible: boolean; // own toggle (effective = AND ancestors)
  color: string; // hex; drives pins / fills under this layer
  maki?: string; // optional Maki icon; when set, overrides place pin glyphs under this layer
  collapsed: boolean; // UI-only, persisted for comfort
  children: NodeId[]; // ordered: layers and/or leaf content nodes
};

type ContentNode = PlaceNode | IsochroneNode;

type Document = {
  rootChildren: NodeId[];
  nodes: Record<NodeId, LayerNode | ContentNode>;
  defaultPlaceColor: string; // for places sitting at root
};
```

### Effective properties (derived)

- **Visible:** node is shown iff every ancestor layer has `visible: true` (and for isochrones, the node’s own `visible`). Hidden parent ⇒ all descendants hidden on the map (Figma/Photoshop behavior).
- **Color:** walk from leaf → parent layers; use the **nearest ancestor layer’s `color`**. Root-level places use `defaultPlaceColor`. Root-level isochrones use their own `color` (panel color control like a layer). Nested isochrones inherit parent layer color.
- **Maki icon:** walk from leaf → parent layers; use the **nearest ancestor layer with `maki` set**. If none, use the place’s Search Box `maki` (UI falls back to `marker`). Nested layer icon overrides parent for its subtree only.
- Nested layer with its own color overrides parent for its subtree only.

### Layer naming defaults

When creating a layer from search: **default name = the search query string** (trimmed). User can rename anytime. Empty manual create: prompt for name first (modal), refuse empty.

### Core mutations (`packages/domain`)

- `createLayer({ name, parentId | root, color? })`
- `renameNode(id, name)`
- `setLayerVisible(id, visible)` / `toggleLayerVisible(id)`
- `setLayerColor(id, color)`
- `setLayerMaki(id, maki | undefined)` — optional pin glyph override for the layer’s subtree
- `moveNodes({ ids, targetParentId | root, index })` — reorder + reparent
- `resolveDropTarget(doc, activeId, overId)` — map DnD over-target to `{ parentId, index }` for `moveNodes` (place→layer nests; layer→layer reorders as sibling)
- `ungroupLayer(id)` — splice layer’s `children` into parent at the layer’s index; delete the layer node
- `deleteNodes(ids)` — recursive for layers (confirm in UI); places removed from parent
- `addPlaces({ places, targetParentId | root, index? })` — dedupe by `mapboxId` within document (skip or toast duplicates)
- `addIsochrone({ draft, targetParentId | root, index? })` — insert independent isochrone leaf (stores GeoJSON + params)
- `setIsochroneVisible` / `setIsochroneColor` — root isochrone chrome; nested paint still inherits layer color

---

## Architecture

```mermaid
flowchart LR
  subgraph ui [apps/web]
    LayersPanel --> Store
    LayersPanel --> resolveDropTarget
    SearchPanel --> usePlaceSearch
    usePlaceSearch --> SearchClient
    usePlaceSearch --> Store
    MapView --> Store
    MapView --> Pins
  end
  subgraph domain [packages/domain]
    TreeOps
    Selectors
    resolveDropTarget
  end
  Store --> TreeOps
  Store --> Selectors
  Store --> IDB[(IndexedDB)]
  SearchClient --> MapboxSearch[Mapbox Search Box]
  MapView --> MapboxGL[Mapbox GL + custom style]
```

### State (Zustand)

Single `documentStore`:

- `document: Document`
- UI: `selectedNodeIds`, `selectedPlaceId` (map focus), `searchPreview` (`color`, `results`, `selectedMapboxIds`)
- Ephemeral panel state (query string, add destination) lives in `usePlaceSearch`, not the store
- Actions wrap `packages/domain` mutations, then persist

Persist middleware → IndexedDB key `map-layers:v1`. No account.

### Map rendering (dual path by design)

Port patterns from `~/Developer/yelp-combinator-frontend` (not a hard dependency — copy/adapt):

- Map shell like `MapRender.tsx`: same style URL + token env
- Pins like `IconMarker` with `variant?: 'outline' | 'filled'` (**default `filled`**): 32px circle, shadow, selected spring scale — **`color` prop from effective layer color**. Filled = layer color fill (`${color}F2`), light border, soft top highlight, white glyph (yelp-combinator visited look). Outline = light gray gradient fill, colored border + glyph.
- Inner glyph = `@mapbox/maki` SVG from effective maki (`getEffectiveMaki`: nearest ancestor layer `maki`, else place `maki`, default `marker`); tinted via `currentColor`
- Optional: Supercluster + `ClusterMarker` if pin density gets high; start without clustering, add if needed
- Click pin → select place in tree + lightweight detail popover (name as rename button — pencil slides in from left / out to right on title hover; address; icon actions: isochrone / fit / delete — same as place row `…` menu)

Only **effectively visible** places and isochrones render.

**Render split:**

| Content kind | Mapbox mechanism |
| --- | --- |
| `place` (points) | `react-map-gl` HTML `<Marker>` |
| `isochrone` (polygons) | `Source` + `Layer` (`fill` / `line`) from stored GeoJSON, under markers |

Layer groups stay DOM-tree UI only; they never become Mapbox style layers. Contours hang off the same tree as leaves and paint via GL sources keyed by node id.

### Search client

`apps/web/src/lib/mapboxSearch.ts`:

1. Forward (debounced) with `proximity` = map center and `bbox` = current viewport (`minLon,minLat,maxLon,maxLat`)
2. Normalize features to `PlaceDraft` (coordinates + optional `maki` in one request; no Suggest→Retrieve session needed for forward)
3. Multi-select in results UI; add selected drafts into the tree

---

## UI design

### Layout

```
┌────────────────────────────────────────────────────┐
│ ┌───────────────┐                                  │
│ │ Search +      │                                  │
│ │ Layers        │     Mapbox map (full-bleed)      │
│ │ (floating)    │     pins colored by layer        │
│ └───────────────┘                                  │
│ ◄── sidebar width + p-2 gutter ──► map inset UI    │
└────────────────────────────────────────────────────┘
```

- **Floating shadcn `Sidebar`** (`variant="floating"`) via `AppSidebar` + `SidebarProvider` / `SidebarInset`; width `--sidebar-width` (~300px / `18.75rem`), with the floating `p-2` gutter so the map shows around the rounded panel.
- **`AppSidebar` split:** `SearchPanel` always top; separator + `LayersPanel` pinned to the bottom (`mt-auto`). Each sizes to content and may exceed half the sidebar when the other is smaller; when both need space they shrink together (≈50% ceiling). Overflow scrolls inside each panel.
- Map is **full-bleed** under the chrome; inset overlays (locate, place detail, toasts) sit in `SidebarInset` (transparent, pointer-events gated) so controls stay clear of the panel.
- Desktop: collapsible offcanvas (`⌘/Ctrl+B`, rail); mobile: sheet + `SidebarTrigger`.
- Body `overflow: hidden`, `h-svh`. Light sidebar tokens (`bg-sidebar`, etc.) — not dark glass, not purple/cream AI defaults.
- Theme is **always light** (`:root` tokens only; no `dark` class / theme toggle in v1).
- Layer / pin colors remain **data-driven hex** (not theme tokens). User-location marker stays semantic blue.

### Layers panel (Figma-like)

Each row:

- Whole-row drag (no grab handle; disabled while renaming; `PointerSensor` distance threshold keeps clicks on controls working)
- Expand/collapse (`CaretRightIcon`, CSS `rotate-90` when open; layers only); child rows animate height via Motion `AnimatePresence` (`height: 0` ↔ `auto`, ~200ms)
- Visibility toggle (`EyeIcon` / `EyeSlashIcon`; layers only)
- Style control (layers only): colored Maki glyph → one popover with **react-color** `GithubPicker` + filterable icon grid; **Auto** clears icon override so place icons show (`LayerStylePicker`)
- Name (inline rename on double-click / Enter)
- Context menu (`DotsThreeVerticalIcon`): layers — New sublayer, Ungroup, Rename, Fit to Map, Delete; places — Add Isochrone…, Rename, Fit to Map, Delete (same actions on the map place-detail popover)

Behaviors:

| Action | Behavior |
| --- | --- |
| Create layer | Modal asks name → insert under selection or root |
| Reorder / nest | Drag **places** onto a layer to nest; drag a **layer** onto another layer to reorder as a sibling (same parent). Nest layers via **New sublayer**. No undo yet — prefer deliberate nesting. |
| Ungroup | Children move to parent (or root); layer removed |
| Hide layer | Eye off; descendants disappear from map; nested eyes remain but ineffective until parent shown |
| Color / icon | Combined style picker; color updates pins immediately; optional Maki overrides descendant glyphs |

Places appear as leaf rows under their layer (indent): name + menu only (no chevron/eye/style picker). Selecting a place highlights it and opens detail — **camera stays put** (use Fit to Map from the row `…` menu or the detail popover to frame). Place detail actions mirror the place row menu.

### Search → add flow

1. User types query in Search section (or Cmd-K later); far-right **clear** (×) empties the query and drops preview pins. Forward search uses map **center** as `proximity` and the current viewport as `bbox` (Mapbox Search Box hard-filters to that box).
2. Results list with checkboxes; “Select all”. Preview pins appear on the map; **camera stays put** (no fit/fly on results).
3. Destination control: **Top level** | **Existing layer…** | **New layer** (name prefilled with query).
4. Confirm **Add** → places inserted; if New layer, create layer then add places as children; **camera stays put** (use Fit to map from the row menu to frame).

---

## Features included in v1 (explicit)

- Nested layers + root-level places
- Show/hide with ancestor cascade
- Per-layer color → pin color
- Optional per-layer Maki icon → overrides descendant pin glyphs (else place Search Box `maki`)
- Create / rename / delete / ungroup / reorder / reparent
- Search Box → add one / many / all
- Local persistence (IndexedDB)
- Place select on map ↔ tree highlight
- Fit bounds to layer or selection

## Explicitly deferred

- Import/export (GeoJSON), share links
- Accounts / sync
- Layer opacity, lock, blend modes
- Multi-document / projects
- Offline maps
- Collaboration
- Isochrone: `driving-traffic`, transit, map-click center, multi-contour rings, post-create edit, fit-bounds on isochrones, auto-add place when creating from search

---

## Isochrones (implemented)

Independent leaf content kind in the same nested tree. Immutable after create (delete + recreate).

### Create UX

- **Search:** trailing map icon on each result → dialog → insert at **root** (isochrone only; does not add the place pin).
- **Existing place:** `…` → “Add isochrone…” → dialog → insert as **sibling** under the same parent as that place.
- Dialog: **profile** (walking / cycling / driving) + **metric** (time / distance) as horizontal **shadcn Tabs** with Phosphor icons + **amount** input (minutes or miles). Single contour; miles converted to meters for the API. Limits: 1–60 min, up to 60 mi (floored to nearest 5 under Mapbox’s ~62.1 mi / 100 km cap). Auto-name e.g. `20 min drive from 2219 Main Street` / `1 mi bike from Café` (falls back to `15 min walk` if no place label).

### Provider

`IsochroneProvider` interface in `apps/web/src/lib/isochrone/`; current impl `mapboxIsochroneProvider` calls [Mapbox Isochrone API](https://docs.mapbox.com/api/navigation/isochrone/) with `polygons=true`, then softens the contour:

| Step | Method | Params |
| --- | --- | --- |
| API | `denoise` | `0.1` — drop small noisy islands |
| API | `generalize` | `200` m — Douglas–Peucker simplify |
| Client | `@turf/polygon-smooth` | `iterations: 3` — Chaikin corner-cutting |

Swap/replace without domain changes.

### Persistence / ToS

Store full GeoJSON plus `center` / `profile` / `metric` / `contours` on the node (IndexedDB). Mapbox ToS generally discourage caching service content and Isochrone has no permanent-storage flag; acceptable for this solo local-first prototype — params are retained so a future refetch path does not need a schema break. Results are always displayed on a Mapbox map.

---

## Implementation phases

1. **Scaffold** — pnpm + turbo + `apps/web` + `packages/domain` + Biome + Tailwind v4 + env template *(living docs already seeded)*
2. **Domain** — tree types, mutations, effective visibility/color selectors + unit tests
3. **Store + persist** — Zustand document store wired to domain
4. **Map shell** — Mapbox style/token, empty map, locate control
5. **Layers panel** — tree UI, visibility, color, create/rename/delete/ungroup, dnd
6. **Pins** — adapted IconMarker driven by effective color; selection sync
7. **Search** — Search Box client + results + add-to-target flow
8. **Polish** — fit bounds, empty states, keyboard rename, confirm dialogs
9. **Doc hygiene** — each phase ends with Architecture Status updated to match the tree

---

## Env

`apps/web/.env`:

```
VITE_MAPBOX_ACCESS_TOKEN=<token>
```

`.env.example` documents the key name only; do not commit secrets. Token names only in this doc.

---

## Living primary doc

**This file (`docs/ARCHITECTURE.md`) is the source of truth** for product intent, domain model, UI, deferred work, and how the system works today.

| File | Role |
| --- | --- |
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) | Canonical living design + current status |
| [`AGENTS.md`](../AGENTS.md) | Short entrypoint: read/update Architecture before/after work |
| [`.cursor/rules/architecture-doc.mdc`](../.cursor/rules/architecture-doc.mdc) | `alwaysApply: true` rule that enforces the habit |

### Agent obligations

1. **Read** this file at the start of non-trivial work.
2. **Update it in the same change** when altering behavior, domain model, stack, UI structure, or deferred/future scope.
3. Keep the top **Status** section current.
4. Prefer amending this doc over inventing parallel design docs (`README` stays install/run only).
5. If a Cursor plan under `.cursor/plans/` exists for a task, **this file wins** after divergence; sync the plan or delete it.

### What not to do

- Do not treat `.cursor/plans/` as the only design copy.
- Do not split into many overlapping markdown files without linking from here.
- Do not commit secrets into this doc (token names only).

---

## Open product defaults (chosen, not optional)

- **Delete layer:** deletes the layer and all nested places/layers (confirm dialog). Ungroup is the non-destructive alternative.
- **Duplicate mapboxId:** skip duplicate with a short toast; do not create a second pin for the same feature.
- **Default new-layer color:** next unused color from a fixed palette rotation.
- **Clustering:** off in v1; add if pin count becomes painful.
