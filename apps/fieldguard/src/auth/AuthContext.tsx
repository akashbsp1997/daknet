import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../api/client";
import type { AuthUser } from "../types/roles";

interface StoredSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "fieldguard.session";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const session = JSON.parse(raw) as StoredSession;
        setAuthToken(session.token);
        setUser(session.user);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function setSession(token: string, nextUser: AuthUser): Promise<void> {
    setAuthToken(token);
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
  }

  async function logout(): Promise<void> {
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
