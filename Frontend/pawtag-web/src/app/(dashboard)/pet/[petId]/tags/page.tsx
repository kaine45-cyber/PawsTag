"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Download, Share2, Smartphone, QrCode, Copy, Check } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { tagService } from "@/services/tag.service";
import { shareOrCopy } from "@/lib/share";
import { useI18n } from "@/i18n/LanguageContext";

const FALLBACK_AVATAR = "/images/corgi.jpg";

export default function PetTagsPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const { pets } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [nfcOn,  setNfcOn]  = useState(false);
  const [tagId,  setTagId]  = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [activateCode, setActivateCode] = useState("");
  const [activateMsg, setActivateMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  async function activateTag(e: React.FormEvent) {
    e.preventDefault();
    const code = activateCode.trim().toUpperCase();
    if (!code) return;
    setActivating(true); setActivateMsg(null);
    try {
      await tagService.activate(code, petId);
      setActivateMsg({ ok: true, text: `Tag ${code} activated for ${pet?.name}!` });
      setActivateCode("");
    } catch {
      setActivateMsg({ ok: false, text: "Could not activate. Code may be invalid or already used." });
    } finally { setActivating(false); }
  }

  const pet    = pets.find((p) => p.id === petId);

  // Lấy tag thật của pet để biết id + trạng thái NFC
  useEffect(() => {
    let on = true;
    tagService.getMine().then((tags) => {
      const t = tags.find((x) => x.petId === petId && x.status === "ACTIVE");
      if (on && t) { setTagId(t.id); setNfcOn(t.nfcLinked); }
    }).catch(() => {});
    return () => { on = false; };
  }, [petId]);

  async function toggleNfc() {
    const next = !nfcOn;
    setNfcOn(next);
    if (tagId) {
      try { await tagService.toggleNfc(tagId, next); } catch { setNfcOn(!next); }
    }
  }
  const tagUrl = pet ? `${origin || "https://pawstag.vn"}/t/${pet.tagCode}` : "";
  const avatar = pet ? (pet.photo ?? FALLBACK_AVATAR) : "";

  function copyLink() {
    navigator.clipboard.writeText(tagUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-5">
        <div className="w-20 h-20 rounded-full bg-[#EEF5FF] flex items-center justify-center">
          <QrCode size={36} className="text-[#4A8FE8]" />
        </div>
        <p className="text-[17px] font-extrabold text-[#1A2332] font-display text-center">{t("common.petNotFound")}</p>
        <Link
          href={ROUTES.petList}
          className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta"
        >
          {t("common.backToPets")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-6 pb-8 gap-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center transition-all active:scale-90">
          <ArrowLeft size={18} className="text-[#1A2332]" />
        </button>
        <div>
          <h1 className="text-[22px] font-black text-[#1A2332] font-display">{t("tags.title")}</h1>
          <p className="text-[12px] text-[#6B7A8D] font-body">{pet.name}</p>
        </div>
      </div>

      {/* QR Card */}
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-[#4A8FE8]" />
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("tags.qrCode")} — {pet.name}</p>
          </div>
          <span className="text-[10px] font-bold text-[#22C55E] bg-[#EDF7F2] px-2.5 py-1 rounded-full font-body">{t("tags.active")}</span>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          {/* QR thật — quét được, mã hoá link công khai của pet */}
          <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center border-2 border-[rgba(74,143,232,0.1)] p-3">
            {tagUrl && (
              <QRCodeSVG
                value={tagUrl}
                size={184}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#1A2332"
                imageSettings={{
                  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='10' fill='%234A8FE8'/%3E%3C/svg%3E",
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
            )}
          </div>

          {/* Tag URL */}
          <div className="w-full flex items-center gap-2 bg-[#F0F4FA] rounded-2xl px-4 py-3">
            <p className="flex-1 text-[12px] text-[#6B7A8D] font-body truncate">{tagUrl}</p>
            <button
              type="button"
              onClick={copyLink}
              className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-card transition-all active:scale-90"
            >
              {copied
                ? <Check size={14} className="text-[#22C55E]" />
                : <Copy size={14} className="text-[#4A8FE8]" />
              }
            </button>
          </div>

          {/* Tag ID */}
          <p className="text-[11px] text-[#9BAABB] font-body">
            {t("tags.tagId")}: <span className="font-mono font-medium text-[#1A2332]">PT-2025-{pet.name.toUpperCase()}-001</span>
          </p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl gradient-brand text-white font-bold text-[13px] font-display shadow-cta transition-all active:scale-95"
            >
              <Download size={15} />
              {t("tags.download")}
            </button>
            <button
              type="button"
              onClick={() => shareOrCopy({ title: `${pet.name}'s PawsTag`, text: `Scan ${pet.name}'s tag`, url: tagUrl })}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F0F4FA] text-[#4A8FE8] font-bold text-[13px] font-display border border-[rgba(74,143,232,0.2)] transition-all active:scale-95"
            >
              <Share2 size={15} />
              {t("tags.share")}
            </button>
          </div>
        </div>
      </div>

      {/* NFC Card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-[#FF7B35]" />
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("tags.nfcTag")}</p>
          </div>
          <button
            type="button"
            onClick={toggleNfc}
            aria-label={nfcOn ? "Disable NFC" : "Enable NFC"}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${nfcOn ? "bg-[#4A8FE8]" : "bg-[#EEF2F7]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${nfcOn ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-[#FFF7F0] rounded-2xl px-4 py-3">
            <Smartphone size={20} className="text-[#FF7B35] shrink-0" />
            <p className="text-[12px] text-[#6B7A8D] font-body leading-relaxed">
              {t("tags.nfcDesc")}
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1A2332] font-body mb-1">{t("tags.nfcLink")}</label>
            <div className="flex items-center gap-2 bg-[#F0F4FA] rounded-2xl px-4 py-3">
              <p className="flex-1 text-[12px] text-[#6B7A8D] font-body truncate">
                https://pawstag.vn/n/{pet.tagCode}
              </p>
              <button
                type="button"
                aria-label="Copy NFC link"
                className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-card transition-all active:scale-90"
              >
                <Copy size={14} className="text-[#4A8FE8]" />
              </button>
            </div>
          </div>

          <div className={`rounded-2xl px-4 py-3 flex items-center gap-2 ${nfcOn ? "bg-[#EDF7F2]" : "bg-[#EEF2F7]"}`}>
            <div className={`w-2 h-2 rounded-full ${nfcOn ? "bg-[#22C55E]" : "bg-[#9BAABB]"}`} />
            <p className={`text-[12px] font-semibold font-body ${nfcOn ? "text-[#2A6B47]" : "text-[#9BAABB]"}`}>
              {nfcOn ? t("tags.nfcEnabled") : t("tags.nfcDisabled")}
            </p>
          </div>
        </div>
      </div>

      {/* Activate a physical tag */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <p className="text-[14px] font-extrabold text-[#1A2332] font-display mb-1">{t("tags.activateTitle")}</p>
        <p className="text-[12px] text-[#9BAABB] font-body mb-3">{t("tags.activateDesc")}</p>
        <form onSubmit={activateTag} className="flex gap-2">
          <input
            type="text"
            value={activateCode}
            onChange={(e) => setActivateCode(e.target.value)}
            placeholder="e.g. A8K92X"
            aria-label="Tag code"
            className="flex-1 h-[46px] px-4 rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.15)] text-[14px] text-[#1A2332] font-mono uppercase outline-none focus:border-[#4A8FE8] focus:bg-white"
          />
          <button type="submit" disabled={activating || !activateCode.trim()} className="px-5 h-[46px] rounded-2xl gradient-brand text-white font-bold text-[13px] font-display shadow-cta active:scale-95 disabled:opacity-60">
            {activating ? "..." : t("tags.activate")}
          </button>
        </form>
        {activateMsg && <p className={`text-[12px] font-body mt-2 ${activateMsg.ok ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{activateMsg.text}</p>}
      </div>

      {/* Collar Preview */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <p className="text-[14px] font-extrabold text-[#1A2332] font-display mb-3">{t("tags.collarPreview")}</p>
        <div className="flex items-center justify-center bg-[#F0F4FA] rounded-2xl py-6">
          <div className="relative">
            <img
              src={avatar}
              alt={pet.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl"
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1A2332] text-white text-[9px] font-mono px-2 py-1 rounded-full whitespace-nowrap">
              {pet.tagCode}
            </div>
          </div>
        </div>
        <Link
          href={ROUTES.tagScan(pet.tagCode)}
          className="mt-4 block text-center text-[12px] text-[#4A8FE8] font-semibold font-body"
        >
          {t("tags.previewPublic")}
        </Link>
      </div>
    </div>
  );
}
