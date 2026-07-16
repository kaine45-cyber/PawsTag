import api from "@/lib/axios";
import axios from "axios";
import type { User } from "@/types";

export interface AuthData {
  owner: User;
}

export interface ForgotPasswordData {
  resendCooldownSeconds: number;
}

const CSRF_COOKIE = "XSRF-TOKEN";
let csrfRequest: Promise<void> | null = null;

function hasCsrfCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${CSRF_COOKIE}=`));
}

function clearCsrfCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CSRF_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

async function ensureCsrfCookie(forceRefresh = false): Promise<void> {
  if (forceRefresh) {
    clearCsrfCookie();
    csrfRequest = null;
  } else if (hasCsrfCookie()) {
    return;
  }

  if (!csrfRequest) {
    csrfRequest = api.get("/auth/csrf", {
      headers: { "Cache-Control": "no-store" },
    }).then(() => undefined).finally(() => { csrfRequest = null; });
  }
  await csrfRequest;
}

async function authPost<T>(url: string, body?: unknown): Promise<T> {
  await ensureCsrfCookie();
  try {
    return (await api.post(url, body)).data.data as T;
  } catch (error) {
    // A 403 on a permit-all auth endpoint is a stale/missing CSRF token. Refresh
    // it once, then retry the exact request. Invalid credentials use HTTP 400.
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      await ensureCsrfCookie(true);
      return (await api.post(url, body)).data.data as T;
    }
    throw error;
  }
}

// Backend bọc { success, data, message } → unwrap .data.data
export const authService = {
  login: async (email: string, password: string): Promise<AuthData> =>
    authPost<AuthData>("/auth/login", { email, password }),

  register: async (name: string, email: string, password: string, phone?: string): Promise<AuthData> =>
    authPost<AuthData>("/auth/register", { name, email, password, phone }),

  // Gửi Google ID token (credential) — backend verify với Google rồi set cookie HttpOnly.
  googleLogin: async (credential: string): Promise<AuthData> =>
    authPost<AuthData>("/auth/google", { credential }),

  // Gửi Facebook access token — backend verify với Graph API rồi set cookie HttpOnly.
  facebookLogin: async (accessToken: string): Promise<AuthData> =>
    authPost<AuthData>("/auth/facebook", { accessToken }),

  me: async (): Promise<User> => (await api.get("/owners/me")).data.data,

  logout: async (): Promise<void> => {
    await authPost<void>("/auth/logout");
    // Backend rotates the CSRF token on logout. Remove the readable copy now so
    // the next login explicitly bootstraps a fresh token.
    clearCsrfCookie();
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordData> =>
    authPost<ForgotPasswordData>("/auth/forgot-password", { email }),

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await authPost<void>("/auth/reset-password", { email, otp, newPassword });
  },
};
