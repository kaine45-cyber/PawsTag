"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, QrCode, MapPin, Shield, Heart, Syringe,
  Phone, Edit2, AlertTriangle, Eye, Calendar, Trash2,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { petService } from "@/services/pet.service";
import { useI18n } from "@/i18n/LanguageContext";
import { formatAge } from "@/utils/formatter";

const FALLBACK_AVATAR = "/images/corgi.jpg";

interface Props {
  params: Promise<{ petId: string }>;
}

export default function PetDetailPage({ params }: Props) {
  const { petId } = use(params);
  const { pets, refreshPets } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pet = pets.find((p) => p.id === petId);

  async function handleDelete() {
    setDeleting(true);
    try {
      await petService.remove(petId);
      await refreshPets();
      router.replace(ROUTES.petList);
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-5">
        <p className="text-[17px] font-extrabold text-[#1A2332] font-display">{t("common.petNotFound")}</p>
        <Link href={ROUTES.petList} className="text-[#4A8FE8] font-semibold font-body text-[14px]">
          ← {t("common.backToPets")}
        </Link>
      </div>
    );
  }

  const avatar = pet.photo ?? FALLBACK_AVATAR;
  const isLost = pet.status === "lost";

  return (
    <div className="flex flex-col min-h-full pb-6">

      {/* ── Hero photo ── */}
      <div className="relative h-56 shrink-0">
        <img src={avatar} alt={pet.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_AVATAR; }} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Back */}
        <Link
          href={ROUTES.petList}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft size={18} color="#fff" />
        </Link>

        {/* Edit */}
        <Link
          href={ROUTES.petEdit(petId)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Edit2 size={16} color="#fff" />
        </Link>

        {/* Name + status */}
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <div>
            <h1 className="text-white font-black text-[26px] font-display leading-none">{pet.name}</h1>
            <p className="text-white/80 text-[13px] font-body mt-0.5">{pet.breed}</p>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full font-body ${
            isLost ? "bg-[#EF4444] text-white" : "bg-[#22C55E] text-white"
          }`}>
            {isLost ? t("common.lost") : t("common.safe")}
          </span>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4 mt-4">

        {/* Lost Mode Alert */}
        {isLost && (
          <div className="gradient-emergency rounded-2xl px-4 py-3 flex items-center gap-3 shadow-emergency">
            <AlertTriangle size={20} color="#fff" className="shrink-0 animate-pulse-slow" />
            <div>
              <p className="text-white font-bold text-[13px] font-display">{t("petd.lostModeActive")}</p>
              <p className="text-white/80 text-[11px] font-body">{t("petd.lostModeDesc")}</p>
            </div>
            <Link href={ROUTES.petLostMode(petId)} className="ml-auto bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl font-display shrink-0">
              {t("petd.manage")}
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Eye,      label: t("petd.totalScans"), value: String(pet.totalScans), color: "#4A8FE8", bg: "#EEF5FF" },
            { icon: Eye,      label: t("petd.today"),      value: String(pet.scansToday), color: "#22C55E", bg: "#EDF7F2" },
            { icon: Calendar, label: t("petd.age"),        value: formatAge(pet.ageMonths, lang), color: "#FF7B35", bg: "#FFF7F0" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-3 shadow-card text-center">
              <div className="w-8 h-8 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ background: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="text-[16px] font-black font-display" style={{ color }}>{value}</p>
              <p className="text-[10px] text-[#6B7A8D] font-body">{label}</p>
            </div>
          ))}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)] flex items-center gap-2">
            <Shield size={15} className="text-[#4A8FE8]" />
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("petd.petInfo")}</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: t("petd.species"),  value: pet.species.charAt(0).toUpperCase() + pet.species.slice(1) },
              { label: t("petd.gender"),   value: pet.gender === "male" ? `${t("common.male")} ♂` : `${t("common.female")} ♀` },
              { label: t("petd.color"),    value: pet.color },
              { label: t("petd.weight"),   value: pet.weight ? `${pet.weight} kg` : "—" },
              { label: t("petd.tagCode"),  value: pet.tagCode },
              { label: t("petd.status"),   value: pet.status === "safe" ? t("common.safe") : t("common.lost") },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-[#9BAABB] font-body uppercase tracking-wide">{label}</p>
                <p className="text-[13px] font-bold text-[#1A2332] font-display mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Contact */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)] flex items-center gap-2">
            <Phone size={15} className="text-[#22C55E]" />
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("petd.contact")}</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div>
              <p className="text-[10px] text-[#9BAABB] font-body uppercase tracking-wide">{t("petd.phone")}</p>
              <a href={`tel:${pet.phone}`} className="text-[14px] font-bold text-[#4A8FE8] font-display mt-0.5 block">
                {pet.phone}
              </a>
            </div>
            {pet.emergencyMessage && (
              <div className="bg-[#FFF7F0] rounded-xl px-3 py-3">
                <p className="text-[10px] text-[#FF7B35] font-body uppercase tracking-wide mb-1">{t("petd.emergencyMessage")}</p>
                <p className="text-[12px] text-[#1A2332] font-body leading-relaxed">{pet.emergencyMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart size={15} className="text-[#EF4444]" />
              <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("petd.medical")}</p>
            </div>
            <Link href="/passport" className="text-[11px] text-[#4A8FE8] font-semibold font-body">
              {t("petd.fullPassport")}
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: t("petd.bloodType"), value: pet.medical.bloodType || t("common.unknown") },
              { label: t("petd.microchip"), value: pet.medical.microchipId ? `···${pet.medical.microchipId.slice(-6)}` : t("common.none") },
              { label: t("petd.allergies"), value: pet.medical.allergies || t("common.noneKnown") },
              { label: t("petd.lastVet"),   value: pet.medical.lastVetVisit || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-[#9BAABB] font-body uppercase tracking-wide">{label}</p>
                <p className="text-[12px] font-bold text-[#1A2332] font-display mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>
          {pet.medical.conditions && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 bg-[#FEF2F2] rounded-xl px-3 py-2">
                <Syringe size={13} className="text-[#EF4444] shrink-0" />
                <p className="text-[11px] text-[#EF4444] font-body">{pet.medical.conditions}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tag Actions */}
        <div className="flex gap-3">
          <Link
            href={ROUTES.petTags(petId)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-brand text-white font-bold text-[14px] font-display shadow-cta transition-all active:scale-95"
          >
            <QrCode size={16} />
            {t("petd.viewQr")}
          </Link>
          <Link
            href={ROUTES.tagScan(pet.tagCode)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#4A8FE8] text-[#4A8FE8] font-bold text-[14px] font-display transition-all active:scale-95"
          >
            <MapPin size={16} />
            {t("petd.publicView")}
          </Link>
        </div>

        {/* Edit + Delete */}
        <div className="flex gap-3">
          <Link href={ROUTES.petEdit(petId)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#EEF2FB] text-[#4A8FE8] font-bold text-[14px] font-display active:scale-95">
            <Edit2 size={16} /> {t("petd.editProfile")}
          </Link>
          <button type="button" onClick={() => setConfirmDel(true)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#FEF2F2] text-[#EF4444] font-bold text-[14px] font-display active:scale-95">
            <Trash2 size={16} /> {t("petd.delete")}
          </button>
        </div>

      </div>

      {/* Confirm delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDel(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-[480px] p-6 pb-8 shadow-form">
            <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-3"><Trash2 size={24} className="text-[#EF4444]" /></div>
            <p className="text-[18px] font-black text-[#1A2332] font-display text-center">{t("petd.deleteWord")} {pet.name}?</p>
            <p className="text-[14px] text-[#6B7A8D] font-body text-center mt-1">{t("petd.deleteDesc")}</p>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setConfirmDel(false)} className="flex-1 py-3.5 rounded-2xl border-2 border-[#EEF2F7] text-[#6B7A8D] font-bold font-display active:scale-95">{t("modal.cancel")}</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 py-3.5 rounded-2xl bg-[#EF4444] text-white font-bold font-display active:scale-95 disabled:opacity-70">{deleting ? t("petd.deleting") : t("petd.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
