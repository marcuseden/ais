-- Vessel owner contact information (from public registries or opt-in)
create table if not exists public.vessel_contacts (
  id uuid primary key default gen_random_uuid(),
  mmsi bigint not null unique,
  
  -- Company/owner info from official registries
  company_name text,
  company_registration_number text, -- Bolagsverket org number, etc.
  business_email text,
  business_phone text,
  registry_source text, -- 'IMO', 'Bolagsverket', 'Companies House', etc.
  registry_url text, -- Source URL for verification
  
  -- Opt-in verification
  is_verified boolean default false,
  verification_method text, -- 'opt-in', 'registry', 'manual'
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  
  -- Contact preferences (opt-in only)
  can_receive_alerts boolean default false,
  preferred_contact_method text, -- 'email', 'sms', 'none'
  opt_in_date timestamptz,
  opt_out_date timestamptz,
  
  -- Data quality and compliance
  data_source text not null, -- 'public_registry', 'opt_in', 'manual_verification'
  last_verified timestamptz,
  notes text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SMS notifications log (for Erik's alerts)
create table if not exists public.sms_notifications (
  id bigserial primary key,
  recipient_phone text not null,
  message_text text not null,
  vessel_mmsi bigint,
  vessel_name text,
  alert_event_id bigint references public.alert_events(id),
  status text not null, -- 'pending', 'sent', 'failed'
  sent_at timestamptz,
  error_message text,
  provider text default 'twilio',
  created_at timestamptz not null default now()
);

-- Contact attempts log (for compliance)
create table if not exists public.contact_log (
  id bigserial primary key,
  vessel_mmsi bigint not null,
  contact_type text not null, -- 'sms', 'email', 'viewed'
  initiated_by uuid references auth.users(id),
  message_content text,
  sent_at timestamptz default now(),
  response_received boolean default false,
  notes text
);

-- Chat conversations per vessel
create table if not exists public.vessel_chats (
  id uuid primary key default gen_random_uuid(),
  vessel_mmsi bigint not null,
  vessel_name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  is_active boolean default true
);

-- Chat messages
create table if not exists public.chat_messages (
  id bigserial primary key,
  chat_id uuid references public.vessel_chats(id) on delete cascade,
  sender_type text not null, -- 'user' (Erik) or 'vessel_crew'
  sender_id uuid references auth.users(id),
  message_text text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  metadata jsonb -- for attachments, location, etc.
);

-- Global vessel registry data (from multiple sources)
create table if not exists public.vessel_registry (
  mmsi bigint primary key,
  imo_number bigint,
  vessel_name text,
  call_sign text,
  flag_country text,
  flag_country_code text,
  
  -- Owner/operator info
  registered_owner text,
  owner_country text,
  operator_name text,
  operator_address text,
  operator_city text,
  operator_country text,
  
  -- Contact info (from public registries)
  company_email text,
  company_phone text,
  company_website text,
  
  -- Vessel details
  vessel_type text,
  gross_tonnage integer,
  deadweight integer,
  length_meters real,
  width_meters real,
  year_built integer,
  
  -- Registry sources
  data_sources text[], -- ['IMO', 'MarineTraffic', 'VesselFinder', 'Equasis']
  last_updated timestamptz not null default now(),
  data_quality_score integer, -- 0-100
  
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_vessel_contacts_mmsi on public.vessel_contacts(mmsi);
create index idx_vessel_contacts_verified on public.vessel_contacts(is_verified, can_receive_alerts);
create index idx_sms_notifications_status on public.sms_notifications(status, created_at);
create index idx_contact_log_mmsi on public.contact_log(vessel_mmsi, sent_at desc);
create index idx_vessel_chats_mmsi on public.vessel_chats(vessel_mmsi, is_active);
create index idx_chat_messages_chat_id on public.chat_messages(chat_id, sent_at desc);
create index idx_vessel_registry_imo on public.vessel_registry(imo_number);
create index idx_vessel_registry_name on public.vessel_registry(vessel_name);

-- RLS policies
alter table public.vessel_contacts enable row level security;
alter table public.sms_notifications enable row level security;
alter table public.contact_log enable row level security;
alter table public.vessel_chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.vessel_registry enable row level security;

-- Only authenticated users (Erik) can view contact data
create policy "vessel_contacts-read" on public.vessel_contacts
  for select using (auth.role() = 'authenticated');

-- Only Erik can insert/update (admin only)
create policy "vessel_contacts-admin" on public.vessel_contacts
  for all using (auth.uid() is not null);

-- SMS notifications readable by authenticated users
create policy "sms_notifications-read" on public.sms_notifications
  for select using (auth.role() = 'authenticated');

-- Contact log readable by authenticated users
create policy "contact_log-read" on public.contact_log
  for select using (auth.role() = 'authenticated');

create policy "contact_log-insert" on public.contact_log
  for insert with check (auth.uid() = initiated_by);

-- Chat policies
create policy "vessel_chats-read" on public.vessel_chats
  for select using (auth.role() = 'authenticated');

create policy "vessel_chats-create" on public.vessel_chats
  for insert with check (auth.uid() = created_by);

create policy "chat_messages-read" on public.chat_messages
  for select using (auth.role() = 'authenticated');

create policy "chat_messages-create" on public.chat_messages
  for insert with check (auth.uid() = sender_id);

-- Vessel registry readable by all authenticated users
create policy "vessel_registry-read" on public.vessel_registry
  for select using (auth.role() = 'authenticated');

create policy "vessel_registry-admin" on public.vessel_registry
  for all using (auth.uid() is not null);

