import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL } from "../database/schema";
import { syncDelivery } from "../api/deliveryApi";

export interface DeliveryRecord {
  id: string;
  barcodeId: string;
  postmanId: string;
  recipientPhone?: string;
  recipientIdHash?: string;
  photoPackageUri?: string;
  photoRecipientUri?: string;
  signatureUri?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  digipin?: string;
  condition?: "sealed" | "damaged" | "tampered";
  tamperFlag: boolean;
  tamperScore?: number;
  tamperReasons?: string[];
  status: "pending" | "completed" | "disputed";
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("fieldguard.db").then(async (db) => {
      await db.execAsync(CREATE_TABLES_SQL);
      return db;
    });
  }
  return dbPromise;
}

/** Saves a delivery locally first — the postman never loses data to a bad connection. */
export async function saveDeliveryLocally(record: DeliveryRecord): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO deliveries (
      id, barcode_id, postman_id, recipient_phone, recipient_id_hash,
      photo_package_uri, photo_recipient_uri, signature_uri,
      gps_latitude, gps_longitude, digipin, condition,
      tamper_flag, tamper_score, tamper_reasons, status,
      synced, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      record.id,
      record.barcodeId,
      record.postmanId,
      record.recipientPhone ?? null,
      record.recipientIdHash ?? null,
      record.photoPackageUri ?? null,
      record.photoRecipientUri ?? null,
      record.signatureUri ?? null,
      record.gpsLatitude ?? null,
      record.gpsLongitude ?? null,
      record.digipin ?? null,
      record.condition ?? null,
      record.tamperFlag ? 1 : 0,
      record.tamperScore ?? null,
      record.tamperReasons ? JSON.stringify(record.tamperReasons) : null,
      record.status,
      now,
      now,
    ],
  );

  await db.runAsync(
    `INSERT INTO sync_queue (id, delivery_id, attempts, created_at) VALUES (?, ?, 0, ?)`,
    [`sync-${record.id}`, record.id, now],
  );
}

/** Retries every queued delivery. Call on app start and whenever connectivity returns. */
export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
  const db = await getDb();
  const queued = await db.getAllAsync<{ id: string; delivery_id: string; attempts: number }>(
    `SELECT sq.id, sq.delivery_id, sq.attempts
     FROM sync_queue sq
     JOIN deliveries d ON d.id = sq.delivery_id
     WHERE d.synced = 0`,
  );

  let synced = 0;
  let failed = 0;

  for (const item of queued) {
    const delivery = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM deliveries WHERE id = ?`,
      [item.delivery_id],
    );
    if (!delivery) continue;

    try {
      await syncDelivery(delivery);
      await db.runAsync(`UPDATE deliveries SET synced = 1 WHERE id = ?`, [item.delivery_id]);
      await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
      synced += 1;
    } catch (error) {
      await db.runAsync(
        `UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?`,
        [error instanceof Error ? error.message : String(error), item.id],
      );
      failed += 1;
    }
  }

  return { synced, failed };
}

export async function listDeliveries(postmanId: string): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT * FROM deliveries WHERE postman_id = ? ORDER BY created_at DESC`,
    [postmanId],
  );
}
