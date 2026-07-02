"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle, MapPin, Share2, MessageCircle, ArrowLeft,
  Bell, Megaphone, Repeat, Eye, Check, Printer,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import dynamic from "next/dynamic";
import { ROUTES } from "@/constants/routes";
import { petService } from "@/services/pet.service";
import { scanService } from "@/services/scan.service";
import { formatAge } from "@/utils/formatter";
import { exportElementToA4Pdf } from "@/lib/pdf";
import { useI18n } from "@/i18n/LanguageContext";
import { localizeRelativeTime } from "@/i18n/localizeNotification";

const ScanMap = dynamic(() => import("@/components/map/ScanMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#EEF2F7] animate-pulse" />,
});

const FALLBACK = "/images/corgi.jpg";

/** Số liệu cộng đồng demo, ổn định theo pet. */
function demoStats(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return { notified: 200 + (h % 800), sharing: 5 + (h % 25), reports: h % 6 };
}

export default function LostModePage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const { pets, refreshPets } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const pet = pets.find((p) => p.id === petId);

  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastScan, setLastScan] = useState<{ location: string; time: string; lat: number | null; lng: number | null } | null>(null);
  const [origin, setOrigin] = useState("");
  const [makingPoster, setMakingPoster] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => { if (pet) setActive(pet.status === "lost"); }, [pet]);
  useEffect(() => {
    if (!pet) return;
    scanService.getHistory(pet.id).then((s) => { if (s[0]) setLastScan({ location: s[0].location, time: s[0].timeAgo, lat: s[0].lat, lng: s[0].lng }); }).catch(() => {});
  }, [pet]);

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-5">
        <AlertTriangle size={40} className="text-[#EF4444]" />
        <p className="text-[16px] font-bold text-[#1A2332] font-display">{t("common.petNotFound")}</p>
        <Link href={ROUTES.petList} className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta">{t("profile.myPets")}</Link>
      </div>
    );
  }

  const tagUrl = `${origin || "https://pawstag.vn"}/t/${pet.tagCode}`;
  const stats = demoStats(pet.id);

  async function setLost(next: boolean) {
    setActive(next);
    setSaving(true);
    try {
      await petService.setLostMode(pet!.id, { isLost: next, lostMessage: next ? `${pet!.name} ${t("lost.defaultMsg")}` : undefined });
      await refreshPets();
    } catch { setActive(!next); }
    finally { setSaving(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(tagUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function downloadPoster() {
    if (!posterRef.current || makingPoster) return;
    setMakingPoster(true);
    try {
      // đợi 1 frame để QR canvas + ảnh vẽ xong
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await exportElementToA4Pdf(posterRef.current, `LOST-${pet!.name}-poster.pdf`);
    } catch (e) {
      console.error("poster export failed", e);
    } finally {
      setMakingPoster(false);
    }
  }

  const reward = pet.rewardAmount && pet.rewardAmount > 0
    ? `${Number(pet.rewardAmount).toLocaleString("vi-VN")}₫`
    : null;
  const subtitle = [pet.breed, pet.ageMonths != null ? formatAge(pet.ageMonths, lang) : null, pet.gender === "male" ? "Male ♂" : "Female ♀"]
    .filter(Boolean).join("  •  ");

  return (
    <div className={`flex flex-col min-h-full ${active ? "bg-[#FDEEEC]" : "bg-[#F7F9FC]"}`}>

      {/* Header */}
      <header className={`px-5 pt-4 pb-4 ${active ? "bg-white border-b border-[#EF4444]/10" : "bg-white"}`}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label="Back" className="w-11 h-11 rounded-full bg-[#EEF2FB] flex items-center justify-center active:scale-90"><ArrowLeft size={18} className="text-[#1A2332]" /></button>
          <div>
            <h1 className={`text-[22px] font-black font-display leading-none flex items-center gap-2 ${active ? "text-[#EF4444]" : "text-[#1A2332]"}`}>
              {active && <span>🚨</span>}{active ? t("lost.titleActive") : t("lost.title")}
            </h1>
            <p className="text-[13px] text-[#9BAABB] font-body mt-1">{active ? t("lost.subActive") : t("lost.sub")}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Pet switcher */}
        {pets.length > 1 && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {pets.map((p) => {
              const sel = p.id === petId;
              return (
                <Link key={p.id} href={ROUTES.petLostMode(p.id)} className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white transition-all ${sel ? (active ? "border-2 border-[#EF4444]" : "border-2 border-[#4A8FE8]") : "border border-[#EEF2F7]"}`}>
                  <img src={p.photo ?? FALLBACK} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                  <span className={`text-[16px] font-bold font-display ${sel ? (active ? "text-[#EF4444]" : "text-[#4A8FE8]") : "text-[#6B7A8D]"}`}>{p.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pet photo */}
        <div className="relative rounded-3xl overflow-hidden">
          <img src={pet.photo ?? FALLBACK} alt={pet.name} className="w-full h-72 object-cover" />
          {active && (
            <>
              <div className="absolute inset-0 bg-[#EF4444]/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                <span className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#EF4444] text-white text-[22px] font-black font-display shadow-lg">
                  <AlertTriangle size={24} /> {t("lost.missing")}
                </span>
                <span className="px-4 py-2 rounded-full bg-black/60 text-white text-[14px] font-bold font-display">
                  {pet.name} • {pet.breed || "—"}{pet.ageMonths != null ? ` • ${formatAge(pet.ageMonths, lang)}` : ""}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Alert toggle card */}
        <div className={`rounded-3xl shadow-card p-5 ${active ? "bg-white border border-[#EF4444]/20" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[18px] font-black font-display flex items-center gap-2 ${active ? "text-[#EF4444]" : "text-[#1A2332]"}`}>
                {active && <span>🚨</span>}{active ? t("lost.alertActive") : t("lost.alertTitle")}
              </p>
              <p className="text-[14px] text-[#9BAABB] font-body mt-0.5">{active ? t("lost.alertSubActive") : t("lost.alertSub")}</p>
            </div>
            <button type="button" onClick={() => setLost(!active)} disabled={saving} aria-label="Toggle lost mode" className={`relative w-16 h-9 rounded-full transition-all shrink-0 disabled:opacity-60 ${active ? "bg-[#EF4444]" : "bg-[#D8DEE9]"}`}>
              <span className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow transition-all ${active ? "translate-x-7" : "translate-x-0"}`} />
            </button>
          </div>

          {active && (
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#F0F4FA]">
              <Stat icon={<Megaphone size={20} className="text-[#EF4444]" />} value={stats.notified} label={t("lost.notified")} />
              <Stat icon={<Repeat size={20} className="text-[#4A8FE8]" />} value={stats.sharing} label={t("lost.sharing")} />
              <Stat icon={<Eye size={20} className="text-[#8B5CF6]" />} value={stats.reports} label={t("lost.reports")} />
            </div>
          )}
        </div>

        {/* Last Known Location */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><MapPin size={18} className="text-[#4A8FE8]" /><p className="text-[16px] font-extrabold text-[#1A2332] font-display">{t("lost.lastLocation")}</p></div>
            {lastScan?.lat != null && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEE2E2] text-[#EF4444] text-[12px] font-bold font-display">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" /> {t("lost.live")}
              </span>
            )}
          </div>
          <div className="relative h-56 z-0">
            {lastScan?.lat != null && lastScan?.lng != null ? (
              <ScanMap lat={lastScan.lat} lng={lastScan.lng} label={lastScan.location} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#EEF2F7] to-[#E3EAF3] flex flex-col items-center justify-center gap-2">
                <div className="map-grid absolute inset-0 opacity-60" />
                <div className="relative w-14 h-14 rounded-full bg-white shadow-card flex items-center justify-center">
                  <MapPin size={26} className="text-[#9BAABB]" />
                </div>
                <p className="relative text-[13px] text-[#9BAABB] font-body">{t("lost.emptyHint")}</p>
              </div>
            )}
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#1A2332] font-display truncate">{lastScan?.location ?? t("lost.noLocation")}</p>
              <p className="text-[13px] text-[#9BAABB] font-body">{t("lost.lastSeen")} {lastScan?.time ?? "—"}</p>
            </div>
            {lastScan?.lat != null && lastScan?.lng != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lastScan.lat},${lastScan.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EEF2FB] text-[#4A8FE8] text-[13px] font-bold font-display active:scale-95"
              >
                <MapPin size={14} /> {t("lost.directions")}
              </a>
            )}
          </div>
        </div>

        {/* Share Alert */}
        <div>
          <p className="text-[18px] font-black text-[#1A2332] font-display mb-3">{t("lost.shareAlert")} 📣</p>
          <div className="grid grid-cols-2 gap-3">
            <a href={`https://zalo.me/share?text=LOST PET: ${pet.name}! ${tagUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EEF2FB] text-[#4A8FE8] font-bold font-display active:scale-95"><Share2 size={18} /> {t("lost.shareZalo")}</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tagUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EEF2FB] text-[#4A8FE8] font-bold font-display active:scale-95"><MessageCircle size={18} /> {t("lost.shareFacebook")}</a>
            <button type="button" className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#FFF7F0] text-[#FF7B35] font-bold font-display active:scale-95"><Bell size={18} /> {t("lost.neighborhood")}</button>
            <button type="button" onClick={copyLink} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EDF7F2] text-[#22C55E] font-bold font-display active:scale-95">{copied ? <Check size={18} /> : <MapPin size={18} />} {copied ? t("lost.copied") : t("lost.copyLink")}</button>
          </div>

          {/* Tạo poster LOST PET (PDF in được) */}
          <button
            type="button"
            onClick={downloadPoster}
            disabled={makingPoster}
            className="mt-3 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#EF4444] to-[#FF7B35] text-white font-extrabold text-[16px] font-display shadow-emergency active:scale-95 disabled:opacity-70"
          >
            {makingPoster
              ? <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> {t("lost.posterMaking")}</>
              : <><Printer size={18} /> {t("lost.posterBtn")}</>}
          </button>
          <p className="text-center text-[12px] text-[#9BAABB] font-body mt-1.5">{t("lost.posterHint")}</p>
        </div>

        {/* Bottom action */}
        {active ? (
          <div className="rounded-3xl bg-[#FBE3E0] p-4 flex flex-col gap-3">
            <p className="text-[15px] font-bold text-[#EF4444] font-display">{t("lost.emergencyActions")}</p>
            <a href={`tel:${pet.phone ?? ""}`} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EF4444] text-white font-extrabold text-[16px] font-display shadow-emergency active:scale-95">🐾 {t("lost.foundReport").replace("{name}", pet.name)}</a>
            <button type="button" onClick={() => setLost(false)} disabled={saving} className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-[#EF4444] text-[#EF4444] font-bold text-[16px] font-display active:scale-95 disabled:opacity-60">✅ {t("lost.isHome").replace("{name}", pet.name)}</button>
          </div>
        ) : (
          <button type="button" onClick={() => setLost(true)} disabled={saving} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#EF4444] to-[#FF7B35] text-white font-extrabold text-[18px] font-display shadow-emergency active:scale-95 disabled:opacity-70">
            {saving ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : "🚨"} {t("lost.activate")}
          </button>
        )}
      </div>

      {/* ──────────── Poster LOST PET (off-screen, chỉ để chụp PDF) ──────────── */}
      <div ref={posterRef} aria-hidden className="fixed top-0 -left-[10000px] w-[595px] bg-white font-display">
        {/* Header đỏ */}
        <div className="bg-[#EF4444] px-10 pt-8 pb-7 text-center">
          <p className="text-white font-extrabold tracking-[0.3em] text-[18px]">⚠ HELP US FIND ⚠</p>
          <p className="text-white font-black text-[68px] leading-none mt-1">LOST PET</p>
          <p className="text-white text-[19px] mt-3 opacity-95">Please help bring {pet.name} home 🙏</p>
        </div>

        {/* Ảnh */}
        <div className="px-10 pt-7">
          <div className="rounded-3xl overflow-hidden border-[6px] border-[#EF4444]">
            <img
              src={pet.photo ?? FALLBACK}
              alt={pet.name}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK; }}
              className="w-full h-[340px] object-cover"
            />
          </div>
        </div>

        {/* Tên + reward */}
        <div className="px-10 pt-6 text-center">
          <p className="text-[#1A2332] font-black text-[48px] leading-none">{pet.name}</p>
          {subtitle && <p className="text-[#6B7A8D] text-[20px] mt-2">{subtitle}</p>}
          {reward && (
            <div className="inline-block mt-4 bg-[#FFF7E6] border-[3px] border-[#FF7B35] rounded-2xl px-8 py-2.5">
              <span className="text-[#FF7B35] font-black text-[26px]">💰 REWARD: {reward}</span>
            </div>
          )}
        </div>

        {/* Chi tiết */}
        <div className="px-10 pt-6 grid grid-cols-2 gap-3">
          {[
            { label: "Color", value: pet.color || "—" },
            { label: "Last seen", value: lastScan?.location ?? "Unknown" },
            { label: "Microchip", value: pet.medical.microchipId ? `···${pet.medical.microchipId.slice(-6)}` : "—" },
            { label: "Seen", value: lastScan?.time ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F7F9FC] rounded-2xl px-5 py-3">
              <p className="text-[#9BAABB] text-[13px] uppercase tracking-wide">{label}</p>
              <p className="text-[#1A2332] font-bold text-[19px] mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Đặc điểm / lời nhắn */}
        {(pet.identificationNotes || pet.lostMessage || pet.emergencyMessage) && (
          <div className="px-10 pt-4">
            <div className="bg-[#FFF7F0] rounded-2xl px-6 py-4">
              <p className="text-[#FF7B35] font-bold text-[14px] uppercase tracking-wide">Distinguishing features / note</p>
              <p className="text-[#1A2332] text-[18px] mt-1.5 leading-relaxed">
                {pet.identificationNotes || pet.lostMessage || pet.emergencyMessage}
              </p>
            </div>
          </div>
        )}

        {/* Liên hệ + QR */}
        <div className="px-10 pt-6">
          <div className="bg-[#1A2332] rounded-3xl px-7 py-6 flex items-center gap-6">
            <div className="bg-white rounded-2xl p-3 shrink-0">
              <QRCodeCanvas value={tagUrl} size={130} level="M" />
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-[15px]">If found, please contact the owner</p>
              <p className="text-white font-black text-[38px] leading-tight mt-1">📞 {pet.phone || "—"}</p>
              <p className="text-white/70 text-[15px] mt-2">or scan the QR to view {pet.name}&apos;s profile &amp; report location</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-5 text-center">
          <p className="text-[#9BAABB] text-[14px]">🐾 Protected by PawsTag &nbsp;•&nbsp; {(origin || "pawstag.vn").replace(/^https?:\/\//, "")}/t/{pet.tagCode}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-[#FDEEEC] rounded-2xl py-3 flex flex-col items-center">
      <div className="mb-1">{icon}</div>
      <p className="text-[22px] font-black text-[#EF4444] font-display leading-none">{value}</p>
      <p className="text-[12px] text-[#9BAABB] font-body mt-1">{label}</p>
    </div>
  );
}
