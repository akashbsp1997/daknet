import { apiClient } from "./client";
import type { GeoPoint } from "../utils/locationUtils";

export interface RouteStop {
  deliveryId: string;
  location: GeoPoint;
  digipin?: string;
}

export interface OptimizedRoute {
  postmanId: string;
  orderedStops: RouteStop[];
  distanceKm: number;
  estimatedMinutes: number;
}

export async function optimizeRoute(postmanId: string, stops: RouteStop[]): Promise<OptimizedRoute> {
  const { data } = await apiClient.post("/route/optimize", { postmanId, stops });
  return data;
}

export async function fetchTodaysRoute(postmanId: string): Promise<OptimizedRoute> {
  const { data } = await apiClient.get(`/route/${postmanId}/today`);
  return data;
}
