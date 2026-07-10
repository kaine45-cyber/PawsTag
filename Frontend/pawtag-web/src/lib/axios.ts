import axios from "axios";

// Default to same-origin /api so local and Vercel both use the Next.js proxy.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every browser request when available.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pawtag_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clear invalid/expired token so the app can force a fresh login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      localStorage.removeItem("pawtag_token");
    }
    return Promise.reject(error);
  },
);

export default api;
