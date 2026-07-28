import { pgTable, text, uuid, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { officesTable } from "./offices";
import { usersTable } from "./users";

export const articlesTable = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  barcode: text("barcode").notNull().unique(),
  articleNumber: text("article_number").notNull(),
  addressee: text("addressee").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("pending"), // pending, delivered, attempted, returned
  deliveryReason: text("delivery_reason"),
  operatorId: uuid("operator_id").references(() => usersTable.id, { onDelete: "set null" }),
  officeId: uuid("office_id").notNull().references(() => officesTable.id, { onDelete: "cascade" }),
  gpsLat: real("gps_lat"),
  gpsLng: real("gps_lng"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  requiresSignature: boolean("requires_signature").notNull().default(false),
  requiresPhoto: boolean("requires_photo").notNull().default(false),
  isCod: boolean("is_cod").notNull().default(false),
  codAmount: real("cod_amount"),

  // --- Photo-scan capture (extracted from a label photo, then reviewed/
  // edited by the operator before saving — see extract-photo route) ---
  mailType: text("mail_type"), // speed_post, registered_post, parcel, gyan_post, magazine_post, blind_mail, regd_newspaper, ordinary_mail, emo, epost, intimation, other
  careOf: text("care_of"),
  houseNumber: text("house_number"),
  subarea: text("subarea"),
  area: text("area"),
  postOffice: text("post_office"),
  pincode: text("pincode"),
  landmark: text("landmark"),
  // Read directly off the label (India Post DigiPIN grid code), not computed
  // from GPS — unlike addressesTable.digipin, which is derived from a visit's
  // actual coordinates.
  digipin: text("digipin"),
  // One-way fingerprint only — same rationale as addressesTable.digilockerIdHash:
  // storing a raw Aadhaar/UIDAI number requires UIDAI AUA/KUA authorization,
  // which this app doesn't have. The operator reviews the plain number during
  // the edit step; only its hash is ever persisted.
  uidaiNumberHash: text("uidai_number_hash"),
  // Storage key of the captured label photo, kept for audit (same private-
  // bucket pattern as addressesTable.referencePhotoUrl / visitPhotosTable).
  scannedPhotoUrl: text("scanned_photo_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // Only ever set by the extract-photo review/save flow, which hashes the
  // reviewed raw number itself — never accepted directly on the general
  // create/update path.
  uidaiNumberHash: true,
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
