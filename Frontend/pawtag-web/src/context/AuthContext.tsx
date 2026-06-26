"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthContextType, User, Pet } from "@/types";
import { authService } from "@/services/auth.service";
import { petService } from "@/services/pet.service";

const TOKEN_KEY = "pawtag_token";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);

  const loadPets = useCallback(async () => {
    try {
      setPets(await petService.getAll());
    } catch {
      setPets([]);
    }
  }, []);

  // Rehydrate session từ JWT
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const me = await authService.me();
        setUser(me);
        setIsLoggedIn(true);
        await loadPets();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadPets]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, owner } = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(owner);
    setIsLoggedIn(true);
    await loadPets();
  }, [loadPets]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, owner } = await authService.register(name, email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(owner);
    setIsLoggedIn(true);
    setPets([]); // tài khoản mới chưa có pet
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setPets([]);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, isLoading, user, pets, login, register, logout, refreshPets: loadPets, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
