-- users are in auth.users

-- store last known vessel positions
create table if not exists public.vessels (
  mmsi bigint primary key,
  name text,
  ship_type text,
  last_lat double precision,
  last_lng double precision,
  sog real, -- speed over ground
  cog real, -- course over ground
  last_seen timestamptz not null default now()
);

-- track positions history (optional for analytics)
create table if not exists public.vessel_positions (
  id bigserial primary key,
  mmsi bigint references public.vessels(mmsi) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  sog real,
  cog real,
  ts timestamptz not null default now()
);

-- user-defined geofences (we'll seed Baltic polygon server-side)
create table if not exists public.geofences (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete cascade,
  name text not null,
  region_geojson jsonb not null, -- Feature or FeatureCollection
  created_at timestamptz not null default now()
);

-- alerts configured by users
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete cascade,
  name text not null,
  -- for now: alert when vessel ENTERS polygon
  geofence_id uuid references public.geofences(id) on delete cascade,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- generated alerts
create table if not exists public.alert_events (
  id bigserial primary key,
  rule_id uuid references public.alert_rules(id) on delete cascade,
  mmsi bigint not null,
  vessel_name text,
  event_type text not null, -- 'enter' | 'exit' etc.
  event_ts timestamptz not null default now(),
  details jsonb
);

-- Security: enable RLS
alter table public.geofences enable row level security;
alter table public.alert_rules enable row level security;
alter table public.alert_events enable row level security;
-- read-only for vessels to all authed users
alter table public.vessels enable row level security;
alter table public.vessel_positions enable row level security;

-- Policies
create policy "geofences-own" on public.geofences
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

create policy "alert_rules-own" on public.alert_rules
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

-- events: owner may read their events; system inserts
create policy "alert_events-read-own" on public.alert_events
  for select using (exists (
    select 1 from public.alert_rules r where r.id = alert_events.rule_id and r.owner = auth.uid()
  ));

-- vessels and positions: readable to authed users, write by system only
create policy "vessels-read" on public.vessels
  for select using (auth.role() = 'authenticated');

create policy "vessel_positions-read" on public.vessel_positions
  for select using (auth.role() = 'authenticated');

-- Create indexes for performance
create index idx_vessels_last_seen on public.vessels(last_seen);
create index idx_vessels_location on public.vessels(last_lat, last_lng);
create index idx_vessel_positions_mmsi_ts on public.vessel_positions(mmsi, ts desc);
create index idx_alert_events_rule_ts on public.alert_events(rule_id, event_ts desc);
create index idx_alert_rules_active on public.alert_rules(owner, is_active);

