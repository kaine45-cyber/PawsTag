"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
            nonce?: string;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

// Nạp Google Identity Services 1 lần cho cả app (không lưu gì nhạy cảm).
let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { gsiPromise = null; reject(new Error("gsi-load-failed")); };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

interface Props {
  /** Nhận Google ID token (credential) — gửi lên POST /auth/google để backend verify. */
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

/**
 * Nút "Sign in with Google" thật (Google Identity Services). Khi người dùng chọn tài khoản,
 * GIS trả credential (ID token) → gọi onCredential. Credential KHÔNG lưu vào localStorage.
 * Ẩn nút nếu chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID hoặc GIS load lỗi.
 */
export default function GoogleSignInButton({ onCredential, text = "continue_with" }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onCredential);
  useEffect(() => { cbRef.current = onCredential; }, [onCredential]);

  // Bắt đầu bằng cấu hình client id (hằng số build-time) → tránh setState đồng bộ trong effect.
  const [available, setAvailable] = useState(!!CLIENT_ID);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    // Nonce chống replay: backend phát (single-use), GIS nhúng vào claim "nonce"
    // của credential, backend đối chiếu khi POST /auth/google.
    Promise.all([loadGsi(), api.get("/auth/google/nonce")])
      .then(([, nonceRes]) => {
        if (cancelled || !boxRef.current) return;
        const nonce: string | undefined = nonceRes.data?.data?.nonce;
        const gid = window.google?.accounts?.id;
        if (!gid || !nonce) { setAvailable(false); return; }
        gid.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => { if (resp.credential) cbRef.current(resp.credential); },
          ux_mode: "popup",
          nonce,
        });
        boxRef.current.innerHTML = ""; // tránh nhân đôi nút khi StrictMode chạy effect 2 lần
        const width = Math.min(Math.max(boxRef.current.offsetWidth || 300, 200), 400);
        gid.renderButton(boxRef.current, {
          type: "standard", theme: "outline", size: "large",
          text, shape: "pill", logo_alignment: "center", width,
        });
      })
      // Google sign-in is optional, so initialization errors only hide this button.
      .catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, [text]);

  if (!available) return null;
  return <div ref={boxRef} className="w-full flex justify-center min-h-[44px]" />;
}
