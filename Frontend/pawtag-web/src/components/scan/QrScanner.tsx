"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/** Quét QR bằng camera. Gọi onResult(text) khi đọc được. */
export default function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const containerId = `qr-${useId().replace(/:/g, "")}`;
  const onResultRef = useRef(onResult);
  const [error, setError] = useState("");

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    let stopped = false;
    const scanner = new Html5Qrcode(containerId);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (stopped) return;
          stopped = true;
          scanner.stop().catch(() => {});
          onResultRef.current(decoded);
        },
        () => { /* lỗi đọc từng frame — bỏ qua */ },
      )
      .catch(() => setError("Cannot access camera. Please allow camera permission."));

    return () => {
      stopped = true;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [containerId]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div id={containerId} className="w-full max-w-[280px] rounded-2xl overflow-hidden" />
      {error && <p className="text-[13px] text-[#EF4444] font-body text-center">{error}</p>}
    </div>
  );
}
