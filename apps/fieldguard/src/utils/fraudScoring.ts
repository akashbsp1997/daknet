import { distanceKm, type GeoPoint } from "./locationUtils";

export interface DeliveryPhotoEvidence {
  /** File size in bytes, as captured on-device. */
  sizeBytes: number;
  /** Unix ms timestamp the photo was taken. */
  capturedAtMs: number;
  location: GeoPoint;
  /** Hash of the verified recipient identity, if a KYC check ran. */
  recipientIdHash?: string;
}

export interface TamperCheckInput {
  dispatchPhoto: DeliveryPhotoEvidence;
  deliveryPhoto: DeliveryPhotoEvidence;
  expectedLocation: GeoPoint;
  /** Recipient identity hash on record for this address/package. */
  expectedRecipientIdHash?: string;
  packageCondition?: "sealed" | "damaged" | "tampered";
}

export interface TamperCheckResult {
  fraudScore: number;
  flagged: boolean;
  reasons: string[];
}

export const TAMPER_THRESHOLDS = {
  /** File-size delta beyond this fraction of the dispatch photo is suspicious. */
  photoSizeVarianceRatio: 0.2,
  /** Deliveries completed faster than this (minutes) are treated as implausible. */
  minPlausibleDeliveryMinutes: 5,
  /** GPS drift beyond this (km) from the expected drop-off point is suspicious. */
  maxLocationDriftKm: 5,
  /** Total score at/above this auto-flags the delivery for admin review. */
  flagAt: 60,
} as const;

const SCORE_WEIGHTS = {
  photoSizeVariance: 30,
  implausibleTiming: 25,
  locationDrift: 20,
  recipientMismatch: 25,
  damagedOrTampered: 20,
} as const;

/**
 * Scores a delivery 0-100 for likelihood of tampering/fraud by comparing the
 * dispatch and delivery photo evidence. Mirrors the checks India Post field
 * teams do manually today, just automated: file-size variance (re-packaging
 * or substituted photo), an impossibly fast delivery, GPS drift from the
 * expected address, a recipient identity mismatch, and a self-reported
 * damaged/tampered package condition.
 */
export function detectTamper(input: TamperCheckInput): TamperCheckResult {
  const { dispatchPhoto, deliveryPhoto, expectedLocation, expectedRecipientIdHash, packageCondition } = input;

  let fraudScore = 0;
  const reasons: string[] = [];

  const sizeRatio =
    Math.abs(deliveryPhoto.sizeBytes - dispatchPhoto.sizeBytes) /
    Math.max(dispatchPhoto.sizeBytes, 1);
  if (sizeRatio > TAMPER_THRESHOLDS.photoSizeVarianceRatio) {
    fraudScore += SCORE_WEIGHTS.photoSizeVariance;
    reasons.push(
      `Photo size differs by ${(sizeRatio * 100).toFixed(0)}% between dispatch and delivery`,
    );
  }

  const deliveryMinutes = (deliveryPhoto.capturedAtMs - dispatchPhoto.capturedAtMs) / 60_000;
  if (deliveryMinutes < TAMPER_THRESHOLDS.minPlausibleDeliveryMinutes) {
    fraudScore += SCORE_WEIGHTS.implausibleTiming;
    reasons.push(
      `Delivery recorded ${deliveryMinutes.toFixed(1)} min after dispatch — too fast to be plausible`,
    );
  }

  const driftKm = distanceKm(deliveryPhoto.location, expectedLocation);
  if (driftKm > TAMPER_THRESHOLDS.maxLocationDriftKm) {
    fraudScore += SCORE_WEIGHTS.locationDrift;
    reasons.push(`Delivery GPS is ${driftKm.toFixed(1)} km from the expected address`);
  }

  if (
    expectedRecipientIdHash &&
    deliveryPhoto.recipientIdHash &&
    deliveryPhoto.recipientIdHash !== expectedRecipientIdHash
  ) {
    fraudScore += SCORE_WEIGHTS.recipientMismatch;
    reasons.push("Recipient identity does not match the address record");
  }

  if (packageCondition === "damaged" || packageCondition === "tampered") {
    fraudScore += SCORE_WEIGHTS.damagedOrTampered;
    reasons.push(`Package reported as ${packageCondition}`);
  }

  fraudScore = Math.min(fraudScore, 100);

  return {
    fraudScore,
    flagged: fraudScore >= TAMPER_THRESHOLDS.flagAt,
    reasons,
  };
}
