"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/LanguageContext";

type CameraInfo = { id: string; label: string };

const BACK_RX = /(back|rear|environment|sau)/i;
const SCAN_CONFIG = { fps: 10, qrbox: { width: 220, height: 220 } };

/**
 * Thứ tự thử camera tự động:
 *  1) các camera có label giống camera sau
 *  2) camera cuối danh sách
 *  3) camera đầu danh sách
 *  4) các camera còn lại
 */
function cameraStartOrder(cameras: CameraInfo[]): string[] {
  const ids = [
    ...cameras.filter((c) => BACK_RX.test(c.label)).map((c) => c.id),
    cameras.at(-1)?.id,
    cameras[0]?.id,
    ...cameras.map((c) => c.id),
  ].filter(Boolean) as string[];
  return Array.from(new Set(ids));
}

/**
 * Quét QR bằng camera — gọi onResult(text) khi đọc được.
 * KHÔNG start bằng { facingMode: "environment" } (fail trên nhiều máy) mà:
 * liệt kê camera qua getCameras() → chọn camera sau → start bằng camera.id.
 * Tự chọn camera phù hợp, có nút retry và thông báo lỗi cụ thể.
 */
export default function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const { t } = useI18n();
  const containerId = `qr-${useId().replace(/:/g, "")}`;

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve()); // nối tiếp mọi thao tác → không chạy 2 scanner
  const activeRef = useRef(true);   // component còn mounted?
  const decodedRef = useRef(false); // đã đọc được 1 mã → không start lại

  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"loading" | "scanning" | "error">("loading");

  // Đưa task vào hàng đợi để các thao tác camera chạy tuần tự (tránh double-start, an toàn StrictMode).
  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current = queueRef.current.catch(() => {}).then(task);
    return queueRef.current;
  }, []);

  // Dừng scanner an toàn: chỉ stop khi đang chạy, nuốt mọi rejection để không crash UI.
  const safeStop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
    } catch { /* ignore */ }
  }, []);

  // Ánh xạ lỗi getUserMedia → thông báo dễ hiểu (lỗi có thể là Error hoặc string).
  const describeError = useCallback((e: unknown): string => {
    const name = (e as { name?: string } | null)?.name ?? "";
    const raw = typeof e === "string" ? e : ((e as { message?: string } | null)?.message ?? "");
    const s = `${name} ${raw}`;
    if (/NotAllowed|Permission|denied/i.test(s)) return t("scanner.errPermission");
    if (/NotFound|device not found|no camera/i.test(s)) return t("scanner.errNotFound");
    if (/NotReadable|Could not start video source|in use|busy|TrackStart/i.test(s)) return t("scanner.errInUse");
    if (/Overconstrained|constraint/i.test(s)) return t("scanner.errOverconstrained");
    return t("scanner.errGeneric");
  }, [t]);

  // Quét thành công: stop → clear → onResult (đúng thứ tự), chỉ 1 lần.
  const handleDecoded = useCallback((decoded: string) => {
    if (decodedRef.current) return;
    decodedRef.current = true;
    enqueue(async () => {
      await safeStop();
      try { scannerRef.current?.clear(); } catch { /* ignore */ }
      onResultRef.current(decoded);
    });
  }, [enqueue, safeStop]);

  // Start bằng cameraId cụ thể (KHÔNG dùng facingMode). Phải được gọi bên trong queue.
  const doStart = useCallback(async (cameraId: string) => {
    const scanner = scannerRef.current;
    if (!scanner || !activeRef.current || decodedRef.current) return false;
    await safeStop(); // đảm bảo phiên trước đã dừng trước khi start phiên mới
    if (!activeRef.current || decodedRef.current) return false;
    try {
      await scanner.start(cameraId, SCAN_CONFIG, (text) => handleDecoded(text), () => { /* bỏ qua lỗi đọc từng frame */ });
      if (!activeRef.current || decodedRef.current) { await safeStop(); return false; }
      setError("");
      setPhase("scanning");
      return true;
    } catch (e) {
      if (!activeRef.current) return false;
      setError(describeError(e));
      setPhase("error");
      return false;
    }
  }, [safeStop, handleDecoded, describeError]);

  // Liệt kê camera → chọn camera sau → start. Phải được gọi bên trong queue.
  const doInit = useCallback(async () => {
    if (!activeRef.current) return;
    setPhase("loading");
    setError("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(t("scanner.errUnsupported"));
      setPhase("error");
      return;
    }

    let devices: CameraInfo[] = [];
    try {
      devices = await Html5Qrcode.getCameras(); // yêu cầu quyền + trả danh sách camera
    } catch (e) {
      if (!activeRef.current) return;
      setError(describeError(e));
      setPhase("error");
      return;
    }
    if (!activeRef.current) return;

    const cameraIds = cameraStartOrder(devices);
    if (cameraIds.length === 0) {
      setError(t("scanner.errNotFound"));
      setPhase("error");
      return;
    }
    for (const id of cameraIds) {
      if (await doStart(id)) return;
    }
  }, [t, describeError, doStart]);

  // Giữ doInit mới nhất trong ref để effect mount KHÔNG phụ thuộc doInit
  // (tránh khởi động lại camera khi đổi ngôn ngữ / re-render).
  const doInitRef = useRef(doInit);
  useEffect(() => { doInitRef.current = doInit; }, [doInit]);

  // Mount: tạo scanner 1 lần, chạy init. Unmount: stop + clear an toàn. Chịu được React StrictMode.
  useEffect(() => {
    activeRef.current = true;
    decodedRef.current = false;
    if (!scannerRef.current) scannerRef.current = new Html5Qrcode(containerId);
    enqueue(() => doInitRef.current());

    return () => {
      activeRef.current = false;
      enqueue(async () => {
        await safeStop();
        try { scannerRef.current?.clear(); } catch { /* ignore */ }
      });
    };
  }, [containerId, enqueue, safeStop]);

  function retry() {
    decodedRef.current = false;
    enqueue(() => doInitRef.current());
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div id={containerId} className="w-full max-w-[280px] rounded-2xl overflow-hidden" />

      {phase === "error" && error && (
        <p className="text-[13px] text-[#EF4444] font-body text-center max-w-[280px]">{error}</p>
      )}

      {phase === "error" && (
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EEF2FB] text-[#4A8FE8] text-[13px] font-bold font-display active:scale-95"
        >
          <RefreshCw size={14} /> {t("scanner.retry")}
        </button>
      )}
    </div>
  );
}
