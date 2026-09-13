import { apiClient } from "./client";
import type { TamperCheckResult } from "../utils/fraudScoring";

/** Server-side re-check — the client-side score in fraudScoring.ts is advisory only. */
export async function checkTamperOnServer(deliveryId: string): Promise<TamperCheckResult> {
  const { data } = await apiClient.post(`/deliveries/${deliveryId}/check-tamper`);
  return data;
}

export async function fetchFlaggedDeliveries() {
  const { data } = await apiClient.get("/alerts/flagged");
  return data;
}

export async function reviewFlaggedDelivery(
  deliveryId: string,
  action: "verified_safe" | "fraudulent",
) {
  const { data } = await apiClient.post(`/alerts/${deliveryId}/review`, { action });
  return data;
}
