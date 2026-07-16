// Re-export everything for backwards compatibility
export type { PetSpecies, PetGender, PetStatus, PetMedical, Pet } from "./pet";
export type { Owner } from "./owner";
// Backwards-compat alias: code that imports `User` from "@/types" still works
export type { Owner as User } from "./owner";
export type { Tag, TagType } from "./tag";
export type { ScanLog } from "./scan";
export type { ApiResponse, NotificationType, Notification } from "./response";

// Keep AuthContextType here since it spans multiple types
import type { Pet } from "./pet";
import type { Owner } from "./owner";

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: Owner | null;
  pets: Pet[];
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshPets: () => Promise<void>;
  setUser: (user: Owner) => void;
}

export type AuthContextType = AuthState & AuthActions;
