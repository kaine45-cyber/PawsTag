// Axios instance configured for the Spring Boot backend.
// Base URL từ NEXT_PUBLIC_API_URL (.env.local) — mặc định http://localhost:8080/api
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// Gắn JWT vào mọi request nếu có
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pawtag_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token hỏng/hết hạn → dọn để buộc đăng nhập lại
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
