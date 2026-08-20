-- Quartier OS — initial schema
-- Public, read-only editorial content. No auth in v1: RLS allows anon SELECT
-- on every table and denies writes (writes happen via the Supabase dashboard
-- or the service role key while seeding).

create extension if not exists pgcrypto;

-- ─── cities ─────────────────────────────────────────────────────────────
create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  country_code text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  default_zoom integer not null default 12,
  is_active boolean not null default true
);

-- ─── quartiers ──────────────────────────────────────────────────────────
create table if not exists quartiers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  city_id uuid not null references cities (id) on delete cascade,
  name text not null,
  slug text not null,
  one_liner text not null,
  description text not null default '',
  polygon jsonb not null,
  center_lat double precision not null,
  center_lng double precision not null,
  price_buy_per_sqm integer,
  price_rent_2br integer,
  hero_photo_url text,
  author_type text not null default 'editorial',
  unique (city_id, slug)
);

create index if not exists quartiers_city_id_idx on quartiers (city_id);

-- ─── quartier_ratings ───────────────────────────────────────────────────
create table if not exists quartier_ratings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quartier_id uuid not null references quartiers (id) on delete cascade,
  dimension text not null check (
    dimension in (
      'safety_day', 'safety_night', 'noise', 'cleanliness',
      'walkability', 'family_friendly', 'nightlife', 'traffic'
    )
  ),
  score integer not null check (score between 1 and 5),
  author_type text not null default 'editorial'
);

create index if not exists quartier_ratings_quartier_id_idx on quartier_ratings (quartier_id);

-- ─── quartier_photos ────────────────────────────────────────────────────
create table if not exists quartier_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quartier_id uuid not null references quartiers (id) on delete cascade,
  url text not null,
  caption text,
  order_index integer not null default 0
);

create index if not exists quartier_photos_quartier_id_idx on quartier_photos (quartier_id);

-- ─── quartier_pros_cons ─────────────────────────────────────────────────
create table if not exists quartier_pros_cons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quartier_id uuid not null references quartiers (id) on delete cascade,
  type text not null check (type in ('pro', 'con')),
  content text not null,
  order_index integer not null default 0
);

create index if not exists quartier_pros_cons_quartier_id_idx on quartier_pros_cons (quartier_id);

-- ─── quartier_commute ───────────────────────────────────────────────────
create table if not exists quartier_commute (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quartier_id uuid not null references quartiers (id) on delete cascade,
  reference_point text not null,
  duration_minutes integer not null
);

create index if not exists quartier_commute_quartier_id_idx on quartier_commute (quartier_id);

-- ─── quartier_essentials ────────────────────────────────────────────────
create table if not exists quartier_essentials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quartier_id uuid not null references quartiers (id) on delete cascade,
  category text not null check (
    category in ('schools', 'clinics', 'pharmacies', 'supermarkets', 'mosques', 'parks')
  ),
  count integer not null default 0
);

create index if not exists quartier_essentials_quartier_id_idx on quartier_essentials (quartier_id);

-- ─── Row Level Security: public read, no public writes ─────────────────
alter table cities enable row level security;
alter table quartiers enable row level security;
alter table quartier_ratings enable row level security;
alter table quartier_photos enable row level security;
alter table quartier_pros_cons enable row level security;
alter table quartier_commute enable row level security;
alter table quartier_essentials enable row level security;

create policy "Public read access" on cities for select using (true);
create policy "Public read access" on quartiers for select using (true);
create policy "Public read access" on quartier_ratings for select using (true);
create policy "Public read access" on quartier_photos for select using (true);
create policy "Public read access" on quartier_pros_cons for select using (true);
create policy "Public read access" on quartier_commute for select using (true);
create policy "Public read access" on quartier_essentials for select using (true);
