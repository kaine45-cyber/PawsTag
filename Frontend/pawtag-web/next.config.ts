import type { NextConfig } from "next";

const rawApiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8082";
const apiProxyTarget = rawApiProxyTarget.replace(/\/api\/?$/, "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Cho phép truy cập dev server qua tunnel HTTPS (cloudflared) để test trên điện thoại.
  // Dùng wildcard nên không phụ thuộc URL ngẫu nhiên mỗi lần mở tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],

  // Explicitly allow first-party pages to use location/camera while preventing
  // an embedding third-party origin from inheriting those capabilities.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(self)" },
        ],
      },
    ];
  },

  // Proxy mọi request /api/* về backend Spring Boot (localhost:8082).
  // Nhờ vậy trình duyệt (kể cả trên điện thoại qua tunnel) chỉ gọi cùng-origin
  // → không dính CORS, không lỗi mixed-content khi trang là HTTPS.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
