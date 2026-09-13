/** DDL for the on-device SQLite store. Mirrors the Supabase schema in supabaseSchema.sql. */
export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  barcode_id TEXT NOT NULL,
  postman_id TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_id_hash TEXT,
  photo_package_uri TEXT,
  photo_recipient_uri TEXT,
  signature_uri TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  digipin TEXT,
  condition TEXT,
  tamper_flag INTEGER DEFAULT 0,
  tamper_score INTEGER,
  tamper_reasons TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  synced INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  delivery_id TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
);
`;
