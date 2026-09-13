import { apiClient } from "./client";

export interface IncomingParcel {
  id: string;
  barcodeId: string;
  senderName: string;
  status: "pending" | "completed" | "disputed";
  tamperFlag: boolean;
}

export async function fetchIncomingParcels(phone: string): Promise<IncomingParcel[]> {
  const { data } = await apiClient.get(`/shipments/incoming/${phone}`);
  return data;
}

export async function fetchParcelDetail(parcelId: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get(`/shipments/${parcelId}`);
  return data;
}

export async function confirmReceipt(parcelId: string): Promise<void> {
  await apiClient.post(`/shipments/${parcelId}/confirm-receipt`);
}

export async function reportIssue(parcelId: string, reason: string, notes?: string): Promise<void> {
  await apiClient.post(`/shipments/${parcelId}/report-issue`, { reason, notes });
}
