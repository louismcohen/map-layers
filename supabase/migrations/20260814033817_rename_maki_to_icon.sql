-- Pin glyph is a catalog-neutral name (Phosphor for layers; leftover Mapbox
-- Maki kebab names may still appear on places). Not a Maki-specific column.
alter table public.layers rename column maki to icon;
alter table public.places rename column maki to icon;
