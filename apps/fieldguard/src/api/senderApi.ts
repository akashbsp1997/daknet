import { apiClient } from "./client";

export interface CreateShipmentInput {
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription?: string;
}

export interface ShipmentSummary {
  id: string;
  barcodeId: string;
  recipientName: string;
  status: "pending" | "completed" | "disputed";
  tamperFlag: boolean;
  createdAt: string;
}

export async function createShipment(
  senderId: string,
  input: CreateShipmentInput,
): Promise<ShipmentSummary> {
  const { data } = await apiClient.post("/shipments", { senderId, ...input });
  return data;
}

export async function fetchSentShipments(senderId: string): Promise<ShipmentSummary[]> {
  const { data } = await apiClient.get(`/shipments/sent/${senderId}`);
  return data;
}

export async function fetchShipmentDetail(shipmentId: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get(`/shipments/${shipmentId}`);
  return data;
}
