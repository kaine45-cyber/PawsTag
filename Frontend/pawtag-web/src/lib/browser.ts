/**
 * Phát hiện trình duyệt nhúng trong ứng dụng (in-app browser / WebView).
 * Các app như Google (GSA), Zalo, Messenger, Instagram, TikTok... mở link
 * bằng WebView riêng — thường CHẶN popup xin quyền vị trí, khiến geolocation
 * bị từ chối ngay lập tức dù người dùng chưa hề bấm gì.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /\bGSA\/|FBAN|FBAV|FB_IAB|Instagram|Zalo|MicroMessenger|Line\/|TikTok|Twitter/i.test(ua) ||
    /; wv\)/.test(ua) // Android WebView chuẩn
  );
}

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/**
 * URL dạng intent:// để mở trang hiện tại bằng trình duyệt mặc định trên Android.
 * Trả về null trên iOS/desktop (không có cơ chế tương đương, hiển thị hướng dẫn thay thế).
 */
export function openInBrowserUrl(): string | null {
  if (typeof window === "undefined" || !isAndroid()) return null;
  const { host, pathname, search } = window.location;
  return `intent://${host}${pathname}${search}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`;
}

/** Copy URL để người dùng iOS dán vào Safari khi WebView không có open-browser intent. */
export async function copyCurrentPageUrl(): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const input = document.createElement("textarea");
    try {
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      input.remove();
    }
  }
}
