-- Commercial vessel procurement and operator information
-- For B2B sales to ships (supplies, repairs, services, etc.)

-- Vessel procurement profiles (per vessel)
create table if not exists public.vessel_procurement (
  mmsi bigint primary key,
  
  -- Commercial operator (the real buyer)
  commercial_operator text,
  operator_address text,
  operator_country text,
  operator_website text,
  
  -- Procurement contacts (critical for sales)
  procurement_email text,
  procurement_phone text,
  supplies_email text,
  spares_email text,
  ops_email text,
  purchasing_email text,
  
  -- Technical manager (orders parts/repairs)
  technical_manager text,
  technical_manager_email text,
  technical_manager_phone text,
  technical_manager_address text,
  
  -- Ship management company
  ship_manager text,
  ship_manager_email text,
  ship_manager_website text,
  
  -- Fleet information
  fleet_name text,
  fleet_size integer,
  sister_vessels text[], -- Other MMSIs in same fleet
  
  -- Port & delivery info
  preferred_port_agent text,
  agent_phone text,
  agent_email text,
  delivery_instructions text,
  accepted_delivery_hours text,
  
  -- Financial/billing
  invoice_email text,
  billing_address text,
  vat_number text,
  payment_terms text,
  
  -- Certificates & class (for technical sales)
  classification_society text, -- DNV, LR, ABS, etc.
  class_notation text,
  last_drydock date,
  next_survey_due date,
  p_and_i_club text, -- Insurance club
  
  -- Crew provisioning
  crew_size integer,
  crew_nationality text,
  crew_manager text,
  food_preferences text,
  
  -- Data quality
  data_sources text[],
  last_updated timestamptz not null default now(),
  data_quality_score integer, -- 0-100
  verified boolean default false,
  
  created_at timestamptz not null default now()
);

-- Port call history (track where ships go)
create table if not exists public.port_calls (
  id bigserial primary key,
  mmsi bigint not null,
  
  -- Port information
  port_name text not null,
  port_country text,
  port_unlocode text, -- UN/LOCODE
  
  -- Timing
  eta timestamptz,
  ata timestamptz, -- Actual time of arrival
  etd timestamptz,
  atd timestamptz, -- Actual time of departure
  
  -- Port services
  port_agent text,
  agent_contact text,
  berth_number text,
  
  -- Operations
  cargo_operation text, -- loading, unloading, bunkering
  services_requested text[],
  
  created_at timestamptz not null default now()
);

-- Operator companies (separate table - one operator = many vessels)
create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  
  -- Company identity
  company_name text not null unique,
  company_type text, -- 'owner', 'operator', 'manager', 'charterer'
  
  -- Contact info
  head_office_address text,
  country text,
  city text,
  postal_code text,
  
  -- Business contacts
  main_email text,
  main_phone text,
  website text,
  
  -- Procurement department
  procurement_dept_email text,
  procurement_dept_phone text,
  purchasing_manager_name text,
  purchasing_manager_email text,
  
  -- Technical department
  technical_dept_email text,
  technical_manager_name text,
  
  -- Fleet data
  total_vessels integer,
  vessel_types text[],
  average_vessel_age real,
  
  -- Registration
  company_registration_number text,
  tax_id text,
  
  -- LinkedIn/social
  linkedin_url text,
  
  -- Data provenance
  data_sources text[],
  last_updated timestamptz not null default now(),
  verified boolean default false,
  
  created_at timestamptz not null default now()
);

-- Link vessels to operators (one vessel can have multiple operators)
create table if not exists public.vessel_operators (
  id uuid primary key default gen_random_uuid(),
  mmsi bigint not null,
  operator_id uuid references public.operators(id) on delete cascade,
  role text not null, -- 'owner', 'commercial_operator', 'technical_manager', 'ship_manager'
  from_date date,
  to_date date,
  is_current boolean default true,
  
  created_at timestamptz not null default now(),
  unique(mmsi, operator_id, role)
);

-- Current vessel status (next port, ETA, etc.)
create table if not exists public.vessel_status (
  mmsi bigint primary key,
  
  -- Destination
  next_port text,
  next_port_country text,
  next_port_unlocode text,
  eta timestamptz,
  etd timestamptz,
  destination_updated_at timestamptz,
  
  -- Current activity
  current_status text, -- 'at_sea', 'in_port', 'anchored', 'moored'
  current_port text,
  
  -- Last known
  last_port_call text,
  last_port_departure timestamptz,
  
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_vessel_procurement_operator on public.vessel_procurement(commercial_operator);
create index idx_vessel_procurement_quality on public.vessel_procurement(data_quality_score desc);
create index idx_port_calls_mmsi_eta on public.port_calls(mmsi, eta desc);
create index idx_port_calls_port on public.port_calls(port_name, eta desc);
create index idx_operators_name on public.operators(company_name);
create index idx_operators_country on public.operators(country);
create index idx_vessel_operators_mmsi on public.vessel_operators(mmsi, is_current);
create index idx_vessel_operators_operator on public.vessel_operators(operator_id, is_current);
create index idx_vessel_status_next_port on public.vessel_status(next_port, eta);

-- RLS policies
alter table public.vessel_procurement enable row level security;
alter table public.port_calls enable row level security;
alter table public.operators enable row level security;
alter table public.vessel_operators enable row level security;
alter table public.vessel_status enable row level security;

-- Authenticated users can read all commercial data
create policy "vessel_procurement-read" on public.vessel_procurement
  for select using (auth.role() = 'authenticated');

create policy "vessel_procurement-admin" on public.vessel_procurement
  for all using (auth.uid() is not null);

create policy "port_calls-read" on public.port_calls
  for select using (auth.role() = 'authenticated');

create policy "port_calls-insert" on public.port_calls
  for insert with check (auth.uid() is not null);

create policy "operators-read" on public.operators
  for select using (auth.role() = 'authenticated');

create policy "operators-admin" on public.operators
  for all using (auth.uid() is not null);

create policy "vessel_operators-read" on public.vessel_operators
  for select using (auth.role() = 'authenticated');

create policy "vessel_operators-admin" on public.vessel_operators
  for all using (auth.uid() is not null);

create policy "vessel_status-read" on public.vessel_status
  for select using (auth.role() = 'authenticated');

create policy "vessel_status-write" on public.vessel_status
  for all using (auth.uid() is not null);

