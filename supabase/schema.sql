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

-- Étape 4 : durée habituelle (en jours) mémorisée par produit, pour proposer la même date au prochain scan.
alter table public.products_cache add column if not exists last_shelf_days integer;

-- Étape 6a : base de recettes (catalogue d'ingrédients, recettes, ingrédients structurés).
-- Catalogue d'ingrédients génériques (singulier) : sert à rapprocher une recette du frigo.
create table if not exists public.ingredients (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null unique,
  rayon         text not null default 'autre',
  unite         text not null default 'pièce' check (unite in ('g', 'ml', 'pièce')), -- unité de stock
  basique       boolean not null default false, -- jamais compté comme manquant (sel, huile…)
  format_achat  numeric,                         -- optionnel : taille d'un paquet, dans l'unité de stock
  prix_estime   numeric                          -- optionnel : prix d'un format d'achat
);

create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  titre       text not null,
  url         text,                              -- lien source (http/https uniquement côté app)
  source      text,                              -- nom du site, affiché à côté du lien
  portions    integer not null default 4 check (portions > 0),
  temps_min   integer,
  tags        text[] not null default '{}',
  ingredients text[] not null default '{}',      -- lignes d'origine, telles que sur le site
  ajoute_par  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id             uuid primary key default gen_random_uuid(),
  recipe_id      uuid not null references public.recipes (id) on delete cascade,
  position       integer not null,
  ingredient_id  uuid not null references public.ingredients (id),
  quantite       numeric,                        -- vide = « à votre goût » (pincée, filet…)
  unite          text check (unite in ('g', 'ml', 'pièce', 'càs', 'càc')),
  unique (recipe_id, position)
);

create index if not exists recipe_ingredients_ingredient_idx on public.recipe_ingredients (ingredient_id);

-- RLS + droits + temps réel, pour les trois tables (même schéma que items).
do $$
declare t text;
begin
  foreach t in array array['ingredients', 'recipes', 'recipe_ingredients'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Authenticated full access" on public.%I', t);
    execute format('create policy "Authenticated full access" on public.%I for all to authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
