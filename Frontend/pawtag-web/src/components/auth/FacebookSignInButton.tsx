"use client";

import { useState } from "react";

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";

interface FbLoginStatus {
  status?: string;
  authResponse?: { accessToken?: string } | null;
}

declare global {
  interface Window {
    FB?: {
      init: (config: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }) => void;
      login: (cb: (resp: FbLoginStatus) => void, opts?: { scope?: string }) => void;
    };
    fbAsyncInit?: () => void;
  }
}

// Nạp Facebook JS SDK 1 lần cho cả app (không lưu gì nhạy cảm).
let fbPromise: Promise<void> | null = null;
function loadFbSdk(appId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.FB) return Promise.resolve();
  if (fbPromise) return fbPromise;
  fbPromise = new Promise<void>((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, version: "v19.0", cookie: false, xfbml: false });
      resolve();
    };
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    s.onerror = () => { fbPromise = null; reject(new Error("fb-sdk-load-failed")); };
    document.head.appendChild(s);
  });
  return fbPromise;
}

interface Props {
  /** Nhận Facebook user access token — gửi lên POST /auth/facebook để backend verify. */
  onToken: (accessToken: string) => void;
  onError?: () => void;
  label?: string;
}

/**
 * Nút "Continue with Facebook" (Facebook JS SDK). FB.login trả access token →
 * gọi onToken; token KHÔNG lưu vào localStorage. Ẩn nút nếu chưa cấu hình
 * NEXT_PUBLIC_FACEBOOK_APP_ID. User đóng popup/không cấp quyền → im lặng (không phải lỗi).
 * Lưu ý: Facebook yêu cầu HTTPS (production) — dev test qua tunnel cloudflared.
 */
export default function FacebookSignInButton({ onToken, onError, label = "Facebook" }: Props) {
  const [busy, setBusy] = useState(false);

  if (!APP_ID) return null;

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      await loadFbSdk(APP_ID!);
      window.FB?.login(
        (resp) => {
          setBusy(false);
          const token = resp.authResponse?.accessToken;
          if (resp.status === "connected" && token) onToken(token);
        },
        { scope: "public_profile,email" },
      );
    } catch {
      setBusy(false);
      onError?.();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex items-center justify-center gap-2 h-[52px] w-full rounded-2xl border border-[#EEF2F7] bg-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span className="text-[18px]">📘</span>
      <span className="text-[14px] font-semibold text-[#1A2332] font-body">{label}</span>
    </button>
  );
}
