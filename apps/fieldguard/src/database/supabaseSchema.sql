-- Backend schema (Supabase/Postgres). Applied once a project is provisioned;
-- kept here as the source of truth the mobile app's local SQLite schema mirrors.

-- One users table for all four roles the app logs in as. Role is set by
-- whoever provisions the account (a sender/addressee self-registers via OTP
-- and is provisioned as such; operative/admin accounts are created by ops).
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  phone varchar(20) unique not null,
  name varchar(120) not null,
  role varchar(20) not null check (role in ('addressee', 'sender', 'operative', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  barcode_id varchar(50) unique not null,
  postman_id uuid references app_users(id),
  sender_id uuid references app_users(id),
  recipient_user_id uuid references app_users(id),
  recipient_name varchar(120),
  recipient_phone varchar(20),
  recipient_id_hash varchar(256),
  pickup_address text,
  delivery_address text,
  package_description text,
  photo_package_url text,
  photo_recipient_url text,
  signature_url text,
  gps_latitude decimal,
  gps_longitude decimal,
  digipin varchar(10),
  condition varchar(20) check (condition in ('sealed', 'damaged', 'tampered')),
  tamper_flag boolean not null default false,
  tamper_score integer check (tamper_score between 0 and 100),
  tamper_reasons text[],
  status varchar(20) not null default 'pending' check (status in ('pending', 'completed', 'disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tamper_alerts (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id),
  alert_reason text not null,
  -- 'operative'/'system' for an automatic flag, 'addressee' for a self-reported issue
  reported_by varchar(20) not null default 'system' check (reported_by in ('system', 'operative', 'addressee')),
  admin_reviewed boolean not null default false,
  reviewed_at timestamptz,
  action_taken varchar(50),
  created_at timestamptz not null default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  postman_id uuid not null references app_users(id),
  delivery_ids uuid[] not null,
  optimized_sequence integer[] not null,
  distance_km decimal,
  estimated_time_minutes integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_deliveries_postman on deliveries (postman_id);
create index if not exists idx_deliveries_sender on deliveries (sender_id);
create index if not exists idx_deliveries_recipient_phone on deliveries (recipient_phone);
create index if not exists idx_deliveries_flagged on deliveries (tamper_flag) where tamper_flag = true;
