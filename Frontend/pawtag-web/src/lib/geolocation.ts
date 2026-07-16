/**
 * Lấy vị trí hiện tại với chiến lược 2 bước:
 *  1. GPS chính xác cao (high accuracy), timeout 15s — chờ đủ lâu để người dùng bấm "Allow".
 *  2. Nếu timeout / không lấy được: thử lại với độ chính xác thấp (WiFi/IP, nhanh hơn)
 *     và chấp nhận vị trí cache tối đa 5 phút.
 *
 * Lỗi được phân loại rõ (denied / timeout / unavailable / unsupported) thay vì
 * gộp chung thành "denied" — trước đây timeout 8s cũng hiện "vui lòng cho phép
 * truy cập vị trí" gây hiểu lầm.
 */
export type GeoErrorKind = "insecure" | "unsupported" | "denied" | "timeout" | "unavailable";

export interface GeoCoords { lat: number; lng: number }

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options),
  );
}

export async function getCurrentCoords(): Promise<GeoCoords> {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new GeoError("insecure");
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new GeoError("unsupported");
  }
  try {
    const p = await getPosition({ enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 });
    return { lat: p.coords.latitude, lng: p.coords.longitude };
  } catch (e) {
    const err = e as GeolocationPositionError;
    // Người dùng từ chối → không thử lại (trình duyệt sẽ không hỏi lại).
    if (err.code === 1) throw new GeoError("denied");
    // Timeout / không có nguồn vị trí → thử lại nhanh với độ chính xác thấp.
    try {
      const p = await getPosition({ enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 });
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    } catch (e2) {
      const err2 = e2 as GeolocationPositionError;
      if (err2.code === 1) throw new GeoError("denied");
      if (err2.code === 3) throw new GeoError("timeout");
      throw new GeoError("unavailable");
    }
  }
}

export class GeoError extends Error {
  constructor(public kind: GeoErrorKind) {
    super(kind);
    this.name = "GeoError";
  }
}
