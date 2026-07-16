import axios from "axios";

// Default to same-origin /api so local and Vercel both use the Next.js proxy.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  withCredentials: true,
  // CSRF double-submit: backend set cookie XSRF-TOKEN (đọc được từ JS),
  // axios tự gắn header X-XSRF-TOKEN cho request cùng-origin.
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error),
);

export default api;
