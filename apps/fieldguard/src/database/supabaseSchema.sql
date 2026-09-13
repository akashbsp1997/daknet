-- Backend schema (Supabase/Postgres). Applied once a project is provisioned;
-- kept here as the source of truth the mobile app's local SQLite schema mirrors.

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  barcode_id varchar(50) unique not null,
  postman_id uuid not null references postmen(id),
  recipient_phone varchar(20),
  recipient_id_hash varchar(256),
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
  admin_reviewed boolean not null default false,
  reviewed_at timestamptz,
  action_taken varchar(50),
  created_at timestamptz not null default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  postman_id uuid not null references postmen(id),
  delivery_ids uuid[] not null,
  optimized_sequence integer[] not null,
  distance_km decimal,
  estimated_time_minutes integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_deliveries_postman on deliveries (postman_id);
create index if not exists idx_deliveries_flagged on deliveries (tamper_flag) where tamper_flag = true;
