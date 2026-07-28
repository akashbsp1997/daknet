import { Router, type IRouter } from "express";
import multer from "multer";
import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { uploadPhoto, getPhotoUrl } from "../lib/storage";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// One-way fingerprint only — same rationale as addresses.ts's computeIdentityHash:
// this app has no UIDAI AUA/KUA authorization to store a raw Aadhaar number.
function hashUidaiNumber(raw: string): string {
  return createHash("sha256").update(raw.trim()).digest("hex");
}

async function formatArticle(a: typeof articlesTable.$inferSelect) {
  return {
    id: a.id, barcode: a.barcode, articleNumber: a.articleNumber,
    addressee: a.addressee, deliveryAddress: a.deliveryAddress,
    phone: a.phone ?? null, status: a.status,
    deliveryReason: a.deliveryReason ?? null,
    operatorId: a.operatorId ?? null, officeId: a.officeId,
    gpsLat: a.gpsLat ?? null, gpsLng: a.gpsLng ?? null,
    deliveredAt: a.deliveredAt?.toISOString() ?? null,
    issuedAt: a.issuedAt.toISOString(),
    requiresSignature: a.requiresSignature,
    requiresPhoto: a.requiresPhoto,
    isCod: a.isCod, codAmount: a.codAmount ?? null,
    mailType: a.mailType ?? null,
    careOf: a.careOf ?? null,
    houseNumber: a.houseNumber ?? null,
    subarea: a.subarea ?? null,
    area: a.area ?? null,
    postOffice: a.postOffice ?? null,
    pincode: a.pincode ?? null,
    landmark: a.landmark ?? null,
    digipin: a.digipin ?? null,
    hasUidaiOnFile: !!a.uidaiNumberHash,
    scannedPhotoUrl: a.scannedPhotoUrl ? await getPhotoUrl(a.scannedPhotoUrl) : null,
  };
}

router.get("/articles", requireAuth, async (req, res): Promise<void> => {
  const { officeId, operatorId, status, date } = req.query as Record<string, string | undefined>;
  let articles = await db.select().from(articlesTable);
  if (officeId) articles = articles.filter(a => a.officeId === officeId);
  if (operatorId) articles = articles.filter(a => a.operatorId === operatorId);
  if (status) articles = articles.filter(a => a.status === status);
  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    articles = articles.filter(a => a.issuedAt >= d && a.issuedAt < nextDay);
  }
  res.json(await Promise.all(articles.map(formatArticle)));
});

router.post("/articles", requireAuth, async (req, res): Promise<void> => {
  const { barcode, articleNumber, addressee, deliveryAddress, phone, operatorId,
    officeId, requiresSignature, requiresPhoto, isCod, codAmount,
    mailType, careOf, houseNumber, subarea, area, postOffice, pincode, landmark,
    digipin, uidaiNumber } = req.body;
  if (!barcode || !articleNumber || !addressee || !deliveryAddress || !officeId) {
    res.status(400).json({ error: "bad_request", message: "Missing required fields" });
    return;
  }
  const [article] = await db.insert(articlesTable).values({
    barcode, articleNumber, addressee, deliveryAddress,
    phone: phone ?? null, operatorId: operatorId ?? null, officeId,
    requiresSignature: requiresSignature ?? false,
    requiresPhoto: requiresPhoto ?? false,
    isCod: isCod ?? false, codAmount: codAmount ?? null,
    status: "pending",
    mailType: mailType ?? null, careOf: careOf ?? null, houseNumber: houseNumber ?? null,
    subarea: subarea ?? null, area: area ?? null, postOffice: postOffice ?? null,
    pincode: pincode ?? null, landmark: landmark ?? null, digipin: digipin ?? null,
    uidaiNumberHash: uidaiNumber ? hashUidaiNumber(uidaiNumber) : null,
  }).returning();
  res.status(201).json(await formatArticle(article));
});

router.get("/articles/scan/:barcode", requireAuth, async (req, res): Promise<void> => {
  const barcode = Array.isArray(req.params.barcode) ? req.params.barcode[0] : req.params.barcode;
  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.barcode, barcode));
  if (!article) { res.status(404).json({ error: "not_found", message: "Article not found" }); return; }
  res.json(await formatArticle(article));
});

router.get("/articles/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!article) { res.status(404).json({ error: "not_found", message: "Article not found" }); return; }
  res.json(await formatArticle(article));
});

router.put("/articles/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, deliveryReason, gpsLat, gpsLng, operatorId,
    mailType, careOf, houseNumber, subarea, area, postOffice, pincode, landmark,
    digipin, uidaiNumber } = req.body;
  const updates: Record<string, unknown> = {};
  if (status !== undefined) {
    updates.status = status;
    if (status === "delivered") updates.deliveredAt = new Date();
  }
  if (deliveryReason !== undefined) updates.deliveryReason = deliveryReason;
  if (gpsLat !== undefined) updates.gpsLat = gpsLat;
  if (gpsLng !== undefined) updates.gpsLng = gpsLng;
  if (operatorId !== undefined) updates.operatorId = operatorId;
  if (mailType !== undefined) updates.mailType = mailType;
  if (careOf !== undefined) updates.careOf = careOf;
  if (houseNumber !== undefined) updates.houseNumber = houseNumber;
  if (subarea !== undefined) updates.subarea = subarea;
  if (area !== undefined) updates.area = area;
  if (postOffice !== undefined) updates.postOffice = postOffice;
  if (pincode !== undefined) updates.pincode = pincode;
  if (landmark !== undefined) updates.landmark = landmark;
  if (digipin !== undefined) updates.digipin = digipin;
  if (uidaiNumber !== undefined) updates.uidaiNumberHash = uidaiNumber ? hashUidaiNumber(uidaiNumber) : null;
  const [article] = await db.update(articlesTable).set(updates).where(eq(articlesTable.id, id)).returning();
  if (!article) { res.status(404).json({ error: "not_found", message: "Article not found" }); return; }
  res.json(await formatArticle(article));
});

// --- Photo proof (label photo captured during a manual photo-scan entry) ---
router.post("/articles/:id/photo", requireAuth, upload.single("photo"), async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!req.file) {
    res.status(400).json({ error: "bad_request", message: "photo file is required" });
    return;
  }
  const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!existing) { res.status(404).json({ error: "not_found", message: "Article not found" }); return; }

  const key = await uploadPhoto(req.file.buffer, req.file.mimetype, "articles");
  const [article] = await db.update(articlesTable)
    .set({ scannedPhotoUrl: key })
    .where(eq(articlesTable.id, id))
    .returning();
  res.json(await formatArticle(article));
});

export default router;
