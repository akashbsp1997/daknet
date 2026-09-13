import { apiClient } from "./client";

export async function syncDelivery(delivery: Record<string, unknown>): Promise<void> {
  await apiClient.post("/deliveries/sync", delivery);
}

export async function fetchDeliveriesForPostman(postmanId: string) {
  const { data } = await apiClient.get(`/deliveries/${postmanId}`);
  return data;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: "pending" | "completed" | "disputed",
) {
  const { data } = await apiClient.put(`/deliveries/${deliveryId}`, { status });
  return data;
}
