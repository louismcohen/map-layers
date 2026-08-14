-- One workspace per user; layers / places / isochrones / tree_nodes hang off workspace_id.
-- Client mints text PKs (`wsp_` / `lyr_` / `plc_` / `iso_` + uuid); Postgres CHECKs prefixes.
-- Explicit GRANTs (authenticated only) + RLS required for Data API exposure.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id text primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  default_place_color text not null default '#1f01b9',
  updated_at timestamptz not null default now(),
  constraint workspaces_id_prefix check (id like 'wsp_%')
);

create table public.layers (
  id text primary key,
  workspace_id text not null references public.workspaces (id) on delete cascade,
  name text not null,
  visible boolean not null default true,
  color text not null,
  maki text,
  collapsed boolean not null default false,
  constraint layers_id_prefix check (id like 'lyr_%')
);

create table public.places (
  id text primary key,
  workspace_id text not null references public.workspaces (id) on delete cascade,
  name text not null,
  source_provider text not null,
  provider_id text not null,
  lng double precision not null,
  lat double precision not null,
  address text,
  feature_type text,
  maki text,
  visible boolean not null default true,
  constraint places_id_prefix check (id like 'plc_%'),
  constraint places_source_provider_check check (source_provider in ('google', 'mapbox')),
  constraint places_provider_unique unique (workspace_id, source_provider, provider_id)
);

create table public.isochrones (
  id text primary key,
  workspace_id text not null references public.workspaces (id) on delete cascade,
  name text not null,
  center_lng double precision not null,
  center_lat double precision not null,
  profile text not null,
  metric text not null,
  contours jsonb not null,
  geojson jsonb not null,
  color text not null,
  visible boolean not null default true,
  origin_place_id text references public.places (id) on delete cascade,
  constraint isochrones_id_prefix check (id like 'iso_%'),
  constraint isochrones_profile_check check (profile in ('walking', 'cycling', 'driving')),
  constraint isochrones_metric_check check (metric in ('time', 'distance')),
  constraint isochrones_origin_place_prefix check (
    origin_place_id is null or origin_place_id like 'plc_%'
  )
);

create table public.tree_nodes (
  workspace_id text not null references public.workspaces (id) on delete cascade,
  node_id text not null,
  kind text not null,
  parent_id text,
  sort_index integer not null,
  primary key (workspace_id, node_id),
  constraint tree_nodes_kind_check check (kind in ('layer', 'place', 'isochrone')),
  constraint tree_nodes_node_id_prefix check (
    (kind = 'layer' and node_id like 'lyr_%')
    or (kind = 'place' and node_id like 'plc_%')
    or (kind = 'isochrone' and node_id like 'iso_%')
  ),
  constraint tree_nodes_parent_id_prefix check (
    parent_id is null or parent_id like 'lyr_%'
  )
);

-- ---------------------------------------------------------------------------
-- Indexes (Postgres does not auto-index FKs)
-- ---------------------------------------------------------------------------

-- workspaces.user_id already indexed via UNIQUE
create index layers_workspace_id_idx on public.layers (workspace_id);
create index places_workspace_id_idx on public.places (workspace_id);
create index isochrones_workspace_id_idx on public.isochrones (workspace_id);
create index isochrones_origin_place_id_idx on public.isochrones (origin_place_id);
-- tree_nodes PK covers workspace_id; add parent/sort for ordered loads
create index tree_nodes_parent_sort_idx
  on public.tree_nodes (workspace_id, parent_id, sort_index);

-- ---------------------------------------------------------------------------
-- Grants (Data API: opt-in exposure; no useful grants to anon)
-- ---------------------------------------------------------------------------

revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.layers from anon, authenticated;
revoke all on table public.places from anon, authenticated;
revoke all on table public.isochrones from anon, authenticated;
revoke all on table public.tree_nodes from anon, authenticated;

grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.layers to authenticated;
grant select, insert, update, delete on table public.places to authenticated;
grant select, insert, update, delete on table public.isochrones to authenticated;
grant select, insert, update, delete on table public.tree_nodes to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.layers enable row level security;
alter table public.places enable row level security;
alter table public.isochrones enable row level security;
alter table public.tree_nodes enable row level security;

-- workspaces: owner = auth.uid()
create policy workspaces_select on public.workspaces
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy workspaces_insert on public.workspaces
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy workspaces_update on public.workspaces
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy workspaces_delete on public.workspaces
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Child tables: ownership via workspace
create policy layers_select on public.layers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = layers.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy layers_insert on public.layers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = layers.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy layers_update on public.layers
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = layers.workspace_id
        and w.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = layers.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy layers_delete on public.layers
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = layers.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy places_select on public.places
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = places.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy places_insert on public.places
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = places.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy places_update on public.places
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = places.workspace_id
        and w.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = places.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy places_delete on public.places
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = places.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy isochrones_select on public.isochrones
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = isochrones.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy isochrones_insert on public.isochrones
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = isochrones.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy isochrones_update on public.isochrones
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = isochrones.workspace_id
        and w.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = isochrones.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy isochrones_delete on public.isochrones
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = isochrones.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy tree_nodes_select on public.tree_nodes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = tree_nodes.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy tree_nodes_insert on public.tree_nodes
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = tree_nodes.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy tree_nodes_update on public.tree_nodes
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = tree_nodes.workspace_id
        and w.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = tree_nodes.workspace_id
        and w.user_id = (select auth.uid())
    )
  );

create policy tree_nodes_delete on public.tree_nodes
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = tree_nodes.workspace_id
        and w.user_id = (select auth.uid())
    )
  );
