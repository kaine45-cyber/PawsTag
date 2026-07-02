"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Scan, ArrowRight, QrCode, Camera, X } from "lucide-react";
import { useI18n } from "@/i18n/LanguageContext";

const QrScanner = dynamic(() => import("@/components/scan/QrScanner"), { ssr: false });

/** Tách mã thẻ từ text quét được (URL .../t/CODE hoặc chính mã). */
function extractCode(text: string): string {
  const m = text.match(/\/t\/([A-Za-z0-9]+)/);
  return (m ? m[1] : text.trim()).toUpperCase();
}

export default function ScanPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(`/t/${c}`);
  }

  function onScanned(text: string) {
    setScanning(false);
    const c = extractCode(text);
    if (c) router.push(`/t/${c}`);
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-10 gap-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mx-auto mb-4 shadow-cta">
          <Scan size={36} color="#fff" />
        </div>
        <h1 className="text-[24px] font-black text-[#1A2332] font-display">{t("scan.title")}</h1>
        <p className="text-[13px] text-[#6B7A8D] font-body mt-1">
          {t("scan.subtitle")}
        </p>
      </div>

      {/* Camera / viewfinder */}
      {scanning ? (
        <div className="flex flex-col items-center gap-3">
          <QrScanner onResult={onScanned} />
          <button type="button" onClick={() => setScanning(false)} className="flex items-center gap-2 text-[14px] font-bold text-[#EF4444] font-display">
            <X size={16} /> {t("scan.stopCamera")}
          </button>
        </div>
      ) : (
        <>
          <div className="relative mx-auto w-56 h-56 rounded-3xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] flex items-center justify-center overflow-hidden">
            <QrCode size={88} className="text-[#C5CFD9]" />
            <span className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#4A8FE8] rounded-tl-lg" />
            <span className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#4A8FE8] rounded-tr-lg" />
            <span className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#4A8FE8] rounded-bl-lg" />
            <span className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#4A8FE8] rounded-br-lg" />
          </div>
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="mx-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl gradient-brand text-white font-bold text-[15px] font-display shadow-cta active:scale-95"
          >
            <Camera size={18} /> {t("scan.withCamera")}
          </button>
        </>
      )}

      {/* Nhập mã thủ công */}
      <form onSubmit={lookup} className="flex flex-col gap-3">
        <label className="text-[13px] font-semibold text-[#1A2332] font-body">{t("scan.orEnter")}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. BOBBY1"
            aria-label="Tag code"
            className="flex-1 h-[50px] px-[18px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.15)] text-[14px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB] uppercase"
          />
          <button
            type="submit"
            disabled={!code.trim()}
            aria-label="Look up tag"
            className="w-[50px] h-[50px] rounded-2xl gradient-brand text-white flex items-center justify-center shadow-cta transition-all active:scale-95 disabled:opacity-50"
          >
            <ArrowRight size={20} />
          </button>
        </div>
        <p className="text-[11px] text-[#9BAABB] font-body">
          {t("scan.openProfile")}
        </p>
      </form>
    </div>
  );
}
