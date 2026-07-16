"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Share2, Phone, MessageCircle, MapPin,
  Shield, AlertTriangle, PawPrint, Check, Loader2,
  Heart, ArrowRight, ChevronUp, ChevronDown,
} from "lucide-react";
import { tagService, type PublicPet } from "@/services/tag.service";
import { scanService } from "@/services/scan.service";
import { petService } from "@/services/pet.service";
import { shareOrCopy } from "@/lib/share";
import { getCurrentCoords, GeoError, type GeoErrorKind } from "@/lib/geolocation";
import { formatAge } from "@/utils/formatter";
import { useI18n } from "@/i18n/LanguageContext";

type LocationState = "idle" | "loading" | "shared" | "denied";

interface Props { params: Promise<{ code: string }>; }

const FALLBACK_PHOTO = "/images/corgi.jpg";

// Chống ghi trùng lượt quét khi effect chạy lại (StrictMode dev) trong cùng phiên tải trang.
const recordedCodes = new Set<string>();

export default function ScanProfilePage({ params }: Props) {
  const { code } = use(params);
  const { t, lang } = useI18n();
  const [pet, setPet] = useState<PublicPet | null>(null);
  const [unassigned, setUnassigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [locState, setLocState] = useState<LocationState>("idle");
  const [geoErr, setGeoErr] = useState<GeoErrorKind>("denied");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [medOpen, setMedOpen] = useState(true);
  const [idOpen, setIdOpen] = useState(true);
  const [scannedAt, setScannedAt] = useState("");

  useEffect(() => {
    let active = true;
    async function markScannedAt() {
      if (!active) return;
      setScannedAt(new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    }
    markScannedAt();
    (async () => {
      try {
        const res = await tagService.getPublic(code);
        if (active) {
          setPet(res.status === "ACTIVE" ? res.pet : null);
          setUnassigned(res.status === "UNASSIGNED");
        }
        // Ghi nhận lượt quét ngay khi mở trang tag (không cần chia sẻ vị trí).
        if (res.status === "ACTIVE" && !recordedCodes.has(code)) {
          recordedCodes.add(code);
          scanService.recordScan(code).catch(() => {});
        }
      } catch {
        if (active) setPet(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    // Chủ pet (đã đăng nhập) → mở khoá "View Full Pet Passport"
    petService.getAll()
      .then((pets) => { if (active) setIsOwner(pets.some((p) => p.tagCode?.toUpperCase() === code.toUpperCase())); })
      .catch(() => {});
    return () => { active = false; };
  }, [code]);

  async function handleSendLocation(found = false) {
    setLocState("loading");
    try {
      const { lat, lng } = await getCurrentCoords();
      setCoords({ lat, lng });
      try { await scanService.recordScan(code, lat, lng, found); } catch { /* vẫn báo thành công */ }
      setLocState("shared");
    } catch (e) {
      // Phân loại lỗi: chỉ hiện "cho phép truy cập" khi thật sự bị từ chối.
      setGeoErr(e instanceof GeoError ? e.kind : "unavailable");
      setLocState("denied");
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center"><Loader2 size={32} className="text-[#4A8FE8] animate-spin" /></div>;
  }

  if (!pet) {
    // Tag CHƯA kích hoạt (đã in nhưng chưa gắn pet) hiển thị khác với mã hoàn toàn không tồn tại.
    const title = unassigned ? t("ps.unassigned") : t("ps.notFound");
    const desc  = unassigned ? t("ps.unassignedDesc") : t("ps.notFoundDesc");
    const iconBg = unassigned ? "bg-[#EEF5FF]" : "bg-[#FEF2F2]";
    const iconColor = unassigned ? "text-[#4A8FE8]" : "text-[#EF4444]";
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-5 gap-5">
        <div className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center`}><PawPrint size={32} className={iconColor} /></div>
        <div className="text-center">
          <h1 className="text-[22px] font-black text-[#1A2332] font-display">{title}</h1>
          <p className="text-[13px] text-[#6B7A8D] font-body mt-2">{desc} <span className="font-mono font-bold text-[#1A2332]">{code}</span></p>
        </div>
        <Link href="/" className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta">{t("ps.learnMore")}</Link>
      </div>
    );
  }

  const photo = pet.photo ?? FALLBACK_PHOTO;
  const isLost = pet.status === "lost";
  const genderLabel = pet.gender === "male" ? `${t("common.male")} ♂` : pet.gender === "female" ? `${t("common.female")} ♀` : "—";

  return (
    <div className="min-h-screen bg-[#F7F9FC]">

      {/* ── Hero ── */}
      <div className="relative h-[360px] overflow-hidden">
        <img src={photo} alt={pet.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F9FC] via-transparent to-transparent" />
        <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-5">
          <Link href="/" className="w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center active:scale-90"><ArrowLeft size={18} className="text-[#1A2332]" /></Link>
          <div className="flex gap-2">
            <button type="button" aria-label="Save" className="w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center active:scale-90"><Heart size={18} className="text-[#1A2332]" /></button>
            <button type="button" onClick={() => shareOrCopy({ title: `${pet.name} — PawsTag`, text: `Help find ${pet.name}!`, url: typeof window !== "undefined" ? window.location.href : undefined })} aria-label="Share" className="w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center active:scale-90"><Share2 size={18} className="text-[#1A2332]" /></button>
          </div>
        </div>
        <div className="absolute bottom-20 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur">
          <PawPrint size={13} className="text-[#4A8FE8]" />
          <span className="text-[13px] font-bold text-[#4A8FE8] font-display">PawsTag</span>
        </div>
      </div>

      <div className="relative z-10 px-5 -mt-6 flex flex-col gap-4 pb-10">

        {/* ── Lost banner ── */}
        {isLost && (
          <div className="rounded-3xl px-5 py-4 flex items-center gap-3 shadow-emergency bg-gradient-to-r from-[#EF4444] to-[#FF7B35]">
            <AlertTriangle size={32} color="#fff" className="shrink-0 animate-pulse-slow" />
            <div>
              <p className="text-[18px] font-black text-white font-display tracking-wide">{t("ps.lostBanner")}</p>
              <p className="text-white/90 text-[14px] font-body">{pet.lostMessage || t("ps.lostFallback").replace("{name}", pet.name)} 🙏</p>
            </div>
          </div>
        )}

        {/* ── I Found This Pet (chỉ khi đang lost & chưa gửi) ── */}
        {isLost && locState !== "shared" && (
          <button
            type="button"
            onClick={() => handleSendLocation(true)}
            disabled={locState === "loading"}
            className="flex items-center justify-center gap-2 py-4 rounded-3xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-extrabold text-[17px] font-display shadow-call active:scale-95 disabled:opacity-80"
          >
            {locState === "loading" ? <Loader2 size={20} className="animate-spin" /> : "🐾"} {t("ps.iFound")}
          </button>
        )}

        {/* ── Name ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[40px] font-black text-[#1A2332] font-display leading-none">{pet.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[15px] text-[#6B7A8D] font-body">
              <span>🦮 {pet.breed}</span>
              {pet.gender && <><span className="text-[#C5CFD9]">•</span><span>{genderLabel}</span></>}
              {pet.ageMonths != null && <><span className="text-[#C5CFD9]">•</span><span>{formatAge(pet.ageMonths, lang)}</span></>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex gap-0.5 justify-end">{[...Array(5)].map((_, i) => <span key={i} className="text-[#F59E0B] text-[14px]">★</span>)}</div>
            <p className="text-[12px] text-[#9BAABB] font-body mt-1">{t("ps.verified")}<br />{t("ps.tag")}</p>
          </div>
        </div>

        {/* ── Owner's Message ── */}
        {pet.emergencyMessage && (
          <div className="rounded-2xl p-4 bg-[#FFF7F0] border-l-4 border-[#FF7B35]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[20px]">{isLost ? "💔" : "💬"}</span>
              <p className="text-[15px] font-extrabold text-[#1A2332] font-display">{t("ps.ownerMsg")}</p>
            </div>
            <p className="text-[15px] text-[#1A2332] font-body leading-relaxed">&ldquo;{pet.emergencyMessage}&rdquo;</p>
          </div>
        )}

        {/* ── Contact buttons ── */}
        <div className="flex flex-col gap-3">
          {pet.phone && (
            <a href={`tel:${pet.phone}`} className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-gradient-to-r from-[#22C55E] to-[#52C97F] shadow-call active:scale-[0.98] transition-all">
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Phone size={22} color="#fff" /></span>
              <div className="flex-1"><p className="text-white font-black text-[18px] font-display">📞 {t("ps.callOwner")}</p><p className="text-white/80 text-[14px] font-body">{pet.phone}</p></div>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ArrowRight size={18} color="#fff" /></span>
            </a>
          )}
          {pet.phone && (
            <a href={`https://zalo.me/${pet.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-gradient-to-r from-[#4A8FE8] to-[#6BA6F0] shadow-zalo active:scale-[0.98] transition-all">
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><MessageCircle size={22} color="#fff" /></span>
              <div className="flex-1"><p className="text-white font-black text-[18px] font-display">💬 {t("ps.msgZalo")}</p><p className="text-white/80 text-[14px] font-body">{t("ps.quickMsg")}</p></div>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ArrowRight size={18} color="#fff" /></span>
            </a>
          )}

          {locState === "shared" ? (
            <div className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-[#EDF7F2] border-2 border-[#22C55E]">
              <span className="w-12 h-12 rounded-2xl bg-[#22C55E]/20 flex items-center justify-center shrink-0"><Check size={22} className="text-[#22C55E]" /></span>
              <div className="flex-1"><p className="text-[#22C55E] font-black text-[16px] font-display">{t("ps.locSent")}</p><p className="text-[#6B7A8D] text-[13px] font-body">{coords ? `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°` : t("ps.gpsShared")}</p></div>
            </div>
          ) : locState === "denied" ? (
            <button
              type="button"
              onClick={() => { if (geoErr !== "denied") handleSendLocation(false); }}
              className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-[#FEF2F2] border-2 border-[#EF4444] text-left w-full"
            >
              <span className="w-12 h-12 rounded-2xl bg-[#EF4444]/20 flex items-center justify-center shrink-0"><MapPin size={22} className="text-[#EF4444]" /></span>
              <div className="flex-1"><p className="text-[#EF4444] font-bold text-[15px] font-display">{t("ps.locUnavail")}</p><p className="text-[#6B7A8D] text-[13px] font-body">{geoErr === "timeout" ? t("ps.locTimeout") : geoErr === "denied" ? t("ps.allowLoc") : t("ps.locUnavailDesc")}</p></div>
            </button>
          ) : (
            <button type="button" onClick={() => handleSendLocation(false)} disabled={locState === "loading"} className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-gradient-to-r from-[#FF7B35] to-[#FFAB7A] shadow-loc active:scale-[0.98] transition-all disabled:opacity-80">
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">{locState === "loading" ? <Loader2 size={22} color="#fff" className="animate-spin" /> : <MapPin size={22} color="#fff" />}</span>
              <div className="flex-1 text-left"><p className="text-white font-black text-[18px] font-display">📍 {t("ps.sendLoc")}</p><p className="text-white/80 text-[14px] font-body">{locState === "loading" ? t("ps.gettingLoc") : t("ps.shareGps")}</p></div>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ArrowRight size={18} color="#fff" /></span>
            </button>
          )}
        </div>

        {/* ── Pet Passport ── */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 bg-gradient-to-r from-[#EEF5FF] to-[#EDF7F2]"><span className="text-[18px]">📋</span><p className="text-[16px] font-extrabold text-[#1A2332] font-display">{t("ps.passport")}</p></div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <PassportCell emoji="🦮" label={t("ps.breed")}       value={pet.breed || "—"} />
            <PassportCell emoji="🎂" label={t("ps.age")}         value={formatAge(pet.ageMonths, lang)} />
            <PassportCell emoji="⚥" label={t("ps.gender")}      value={genderLabel} />
            <PassportCell emoji="💉" label={t("ps.vaccination")} value={pet.vaccinated ? t("ps.upToDate") : t("ps.notRecorded")} />
            <PassportCell emoji="⚖️" label={t("ps.weight")}      value={pet.weight ? `${pet.weight} kg` : "—"} />
            <PassportCell emoji="🎨" label={t("ps.color")}       value={pet.color || "—"} />
          </div>
        </div>

        {/* ── Medical Notes ── */}
        <Section emoji="🏥" title={t("ps.medicalNotes")} open={medOpen} onToggle={() => setMedOpen(!medOpen)} headerBg="from-[#FFF7F0] to-[#FFF0E8]">
          <Field label={t("ps.allergies")}     value={pet.medical.allergies || t("ps.noAllergies")} ok />
          <Field label={t("ps.lastVet")} value={pet.medical.lastVetVisit ? `${formatDate(pet.medical.lastVetVisit)}${pet.medical.vetName ? ` — ${pet.medical.vetName}` : ""}` : t("ps.notRecorded")} ok={!!pet.medical.lastVetVisit} />
          {pet.medical.medications && <Field label={t("ps.medications")} value={pet.medical.medications} />}
          <Field label={t("ps.specialNeeds")} value={pet.medical.conditions || t("ps.none")} ok />
          {pet.medical.bloodType && <Field label={t("ps.bloodType")} value={pet.medical.bloodType} />}
        </Section>

        {/* ── Identification Notes ── */}
        <Section emoji="🔍" title={t("ps.idNotes")} open={idOpen} onToggle={() => setIdOpen(!idOpen)} headerBg="from-[#EDF7F2] to-[#EEF5FF]">
          {pet.color && <Field label={t("ps.coloring")} value={pet.color} />}
          {pet.collar && <Field label={t("ps.collar")} value={pet.collar} />}
          {pet.medical.microchipId && <Field label={t("ps.microchip")} value={pet.medical.microchipId} mono />}
          {pet.identificationNotes && <Field label={t("ps.marks")} value={pet.identificationNotes} />}
        </Section>

        {/* ── View Full Passport — CHỦ PET ONLY ── */}
        {isOwner && (
          <Link href="/passport" className="rounded-3xl px-4 py-4 flex items-center gap-4 bg-gradient-to-r from-[#1A2332] to-[#2A6B47] active:scale-[0.98] transition-all">
            <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 text-[22px]">📋</span>
            <div className="flex-1 min-w-0"><p className="text-white font-black text-[17px] font-display">{t("ps.viewFull")}</p><p className="text-white/75 text-[13px] font-body">{t("ps.viewFullSub")}</p></div>
            <ArrowRight size={20} color="#fff" className="shrink-0" />
          </Link>
        )}

        {/* ── Verified ── */}
        <div className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-br from-[#EEF5FF] to-[#EDF7F2] border border-[rgba(74,143,232,0.15)]">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-cta shrink-0"><Shield size={24} color="#fff" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold text-[#1A2332] font-display flex items-center gap-1">✅ {t("ps.verifiedBy")}</p>
            <p className="text-[13px] text-[#6B7A8D] font-body">{t("ps.authenticated")}</p>
            <p className="text-[12px] text-[#9BAABB] font-mono mt-1">{t("ps.secureId")}: PT-2025-{pet.name.toUpperCase()}-001</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pt-2">
          <p className="flex items-center justify-center gap-1.5 text-[16px] font-bold font-display"><PawPrint size={16} className="text-[#4A8FE8]" /><span className="text-[#4A8FE8]">PawsTag</span></p>
          <p className="text-[13px] text-[#9BAABB] font-body mt-1">{t("ps.footerTagline")}</p>
          {scannedAt && <p className="text-[12px] text-[#C5CFD9] font-body mt-1">{t("ps.scannedAt")} {scannedAt}</p>}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

function PassportCell({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="bg-[#F7F9FC] rounded-2xl p-3">
      <p className="flex items-center gap-1 text-[11px] font-bold text-[#9BAABB] font-display uppercase tracking-wide">{emoji} {label}</p>
      <p className="text-[15px] font-bold text-[#1A2332] font-display mt-1">{value}</p>
    </div>
  );
}

function Section({ emoji, title, open, onToggle, headerBg, children }: {
  emoji: string; title: string; open: boolean; onToggle: () => void; headerBg: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <button type="button" onClick={onToggle} className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${headerBg}`}>
        <span className="flex items-center gap-2"><span className="text-[18px]">{emoji}</span><span className="text-[16px] font-extrabold text-[#1A2332] font-display">{title}</span></span>
        {open ? <ChevronUp size={18} className="text-[#9BAABB]" /> : <ChevronDown size={18} className="text-[#9BAABB]" />}
      </button>
      {open && <div className="p-4 flex flex-col gap-3.5">{children}</div>}
    </div>
  );
}

function Field({ label, value, ok, mono }: { label: string; value: string; ok?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[#9BAABB] font-display uppercase tracking-wide">{label}</p>
        <p className={`text-[15px] text-[#1A2332] mt-0.5 ${mono ? "font-mono" : "font-body"}`}>{value}</p>
      </div>
      {ok && <span className="w-6 h-6 rounded-md bg-[#22C55E] flex items-center justify-center shrink-0 mt-1"><Check size={14} color="#fff" strokeWidth={3} /></span>}
    </div>
  );
}
