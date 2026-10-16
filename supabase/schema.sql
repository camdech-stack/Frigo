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

-- Temps réel : publication de la table (utilisé à l'étape 2).
alter publication supabase_realtime add table public.items;
