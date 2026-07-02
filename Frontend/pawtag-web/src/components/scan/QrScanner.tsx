"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/** Quét QR bằng camera. Gọi onResult(text) khi đọc được. */
export default function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const containerId = useRef(`qr-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    const scanner = new Html5Qrcode(containerId.current);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (stopped) return;
          stopped = true;
          scanner.stop().catch(() => {});
          onResult(decoded);
        },
        () => { /* lỗi đọc từng frame — bỏ qua */ },
      )
      .catch(() => setError("Cannot access camera. Please allow camera permission."));

    return () => {
      stopped = true;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div id={containerId.current} className="w-full max-w-[280px] rounded-2xl overflow-hidden" />
      {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}
    </div>
  );
}
