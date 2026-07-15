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

const LEGACY_TOKEN_KEY = "pawtag_token";

const AuthContext = createContext<AuthContextType | null>(null);

function clearLegacyToken() {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // localStorage can be unavailable in restricted browser modes.
  }
}

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

  // Rehydrate session from the HttpOnly auth cookie.
  useEffect(() => {
    let active = true;

    async function rehydrate() {
      clearLegacyToken();
      try {
        const me = await authService.me();
        if (!active) return;
        setUser(me);
        setIsLoggedIn(true);
        await loadPets();
      } catch {
        if (!active) return;
        setUser(null);
        setPets([]);
        setIsLoggedIn(false);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    rehydrate();
    return () => { active = false; };
  }, [loadPets]);

  const login = useCallback(async (email: string, password: string) => {
    const { owner } = await authService.login(email, password);
    setUser(owner);
    setIsLoggedIn(true);
    await loadPets();
  }, [loadPets]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { owner } = await authService.register(name, email, password);
    setUser(owner);
    setIsLoggedIn(true);
    setPets([]);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { owner } = await authService.googleLogin(credential);
    setUser(owner);
    setIsLoggedIn(true);
    await loadPets();
  }, [loadPets]);

  const loginWithFacebook = useCallback(async (accessToken: string) => {
    const { owner } = await authService.facebookLogin(accessToken);
    setUser(owner);
    setIsLoggedIn(true);
    await loadPets();
  }, [loadPets]);

  const logout = useCallback(() => {
    authService.logout();
    clearLegacyToken();
    setUser(null);
    setPets([]);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, isLoading, user, pets, login, register, loginWithGoogle, loginWithFacebook, logout, refreshPets: loadPets, setUser }}
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
