import api from "@/lib/axios";
import type { User } from "@/types";

export interface AuthData {
  owner: User;
}

export interface ForgotPasswordData {
  resendCooldownSeconds: number;
}

// Backend bọc { success, data, message } → unwrap .data.data
export const authService = {
  login: async (email: string, password: string): Promise<AuthData> =>
    (await api.post("/auth/login", { email, password })).data.data,

  register: async (name: string, email: string, password: string, phone?: string): Promise<AuthData> =>
    (await api.post("/auth/register", { name, email, password, phone })).data.data,

  // Gửi Google ID token (credential) — backend verify với Google rồi set cookie HttpOnly.
  googleLogin: async (credential: string): Promise<AuthData> =>
    (await api.post("/auth/google", { credential })).data.data,

  // Gửi Facebook access token — backend verify với Graph API rồi set cookie HttpOnly.
  facebookLogin: async (accessToken: string): Promise<AuthData> =>
    (await api.post("/auth/facebook", { accessToken })).data.data,

  me: async (): Promise<User> => (await api.get("/owners/me")).data.data,

  logout: () => api.post("/auth/logout").catch(() => {}),

  forgotPassword: async (email: string): Promise<ForgotPasswordData> =>
    (await api.post("/auth/forgot-password", { email })).data.data,

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await api.post("/auth/reset-password", { email, otp, newPassword });
  },
};
