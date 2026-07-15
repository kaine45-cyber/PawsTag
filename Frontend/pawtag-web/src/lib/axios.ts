import axios from "axios";

// Default to same-origin /api so local and Vercel both use the Next.js proxy.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error),
);

export default api;
