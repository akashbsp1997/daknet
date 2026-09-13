import axios from "axios";

// Points at the FieldGuard backend once it exists (Week 4 of the build plan).
// Not deployed yet — set EXPO_PUBLIC_FIELDGUARD_API_URL before wiring real calls.
const BASE_URL = process.env.EXPO_PUBLIC_FIELDGUARD_API_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
});

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function getAuthToken(): string | null {
  return authToken;
}
