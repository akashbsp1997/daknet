export type UserRole = "addressee" | "sender" | "operative" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}
