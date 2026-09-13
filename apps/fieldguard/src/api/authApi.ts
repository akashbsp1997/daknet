import { apiClient, setAuthToken } from "./client";

export interface LoginResult {
  token: string;
  postmanId: string;
  name: string;
}

export async function requestOtp(phone: string): Promise<void> {
  await apiClient.post("/auth/request-otp", { phone });
}

export async function verifyOtp(phone: string, otp: string): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>("/auth/verify-otp", { phone, otp });
  setAuthToken(data.token);
  return data;
}

export function logout(): void {
  setAuthToken(null);
}
