"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scan, ArrowRight, QrCode } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(`/t/${c}`);
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-10 gap-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mx-auto mb-4 shadow-cta">
          <Scan size={36} color="#fff" />
        </div>
        <h1 className="text-[24px] font-black text-[#1A2332] font-display">Scan a PawsTag</h1>
        <p className="text-[13px] text-[#6B7A8D] font-body mt-1">
          Dùng camera điện thoại quét mã QR trên thẻ, hoặc nhập mã thủ công bên dưới.
        </p>
      </div>

      {/* Khung viewfinder minh hoạ */}
      <div className="relative mx-auto w-56 h-56 rounded-3xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] flex items-center justify-center overflow-hidden">
        <QrCode size={88} className="text-[#C5CFD9]" />
        {/* 4 góc viewfinder */}
        <span className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#4A8FE8] rounded-tl-lg" />
        <span className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#4A8FE8] rounded-tr-lg" />
        <span className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#4A8FE8] rounded-bl-lg" />
        <span className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#4A8FE8] rounded-br-lg" />
      </div>

      {/* Nhập mã thủ công */}
      <form onSubmit={lookup} className="flex flex-col gap-3">
        <label className="text-[13px] font-semibold text-[#1A2332] font-body">Nhập mã thẻ</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VD: BOBBY1"
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
          Mở trang hồ sơ công khai của thú cưng gắn với mã thẻ này.
        </p>
      </form>
    </div>
  );
}
