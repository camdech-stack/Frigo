-- Schéma de référence de Frigo. À exécuter dans Supabase > SQL Editor.

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  barcode     text,
  name        text not null,
  brand       text,
  image_url   text,
  category    text,
  quantity    numeric not null default 1,
  unit        text,
  added_at    timestamptz not null default now(),
  expires_at  date,
  status      text not null default 'in_stock' check (status in ('in_stock', 'used', 'thrown')),
  location    text not null default 'frigo' check (location in ('frigo', 'congélo', 'placard'))
);

-- RLS : accès réservé aux utilisateurs authentifiés (tous les droits).
alter table public.items enable row level security;

drop policy if exists "Authenticated full access" on public.items;
create policy "Authenticated full access" on public.items
  for all
  to authenticated
  using (true)
  with check (true);

-- Droits d'accès à l'API : réservés aux utilisateurs connectés (pas à anon).
-- Nécessaire car "Automatically expose new tables" est désactivé.
grant select, insert, update, delete on public.items to authenticated;

-- Temps réel : publication de la table (étape 2). Sans effet si déjà ajoutée.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;

-- Étape 3 : cache des produits identifiés par code-barres (Open Food Facts + mes corrections).
create table if not exists public.products_cache (
  barcode     text primary key,
  name        text,
  brand       text,
  category    text,
  image_url   text,
  updated_at  timestamptz not null default now()
);

alter table public.products_cache enable row level security;

drop policy if exists "Authenticated full access" on public.products_cache;
create policy "Authenticated full access" on public.products_cache
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.products_cache to authenticated;
