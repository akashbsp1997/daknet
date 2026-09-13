import { apiClient } from "./client";
import type { AuthUser } from "../types/roles";

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export async function requestOtp(phone: string): Promise<void> {
  await apiClient.post("/auth/request-otp", { phone });
}

/** The backend determines the account's role (addressee/sender/operative/admin) — the app never asks. */
export async function verifyOtp(phone: string, otp: string): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>("/auth/verify-otp", { phone, otp });
  return data;
}
