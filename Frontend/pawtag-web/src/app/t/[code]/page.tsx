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

type LocationState = "idle" | "loading" | "shared" | "denied";

interface Props { params: Promise<{ code: string }>; }

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";

export default function ScanProfilePage({ params }: Props) {
  const { code } = use(params);
  const [pet, setPet] = useState<PublicPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [locState, setLocState] = useState<LocationState>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [medOpen, setMedOpen] = useState(true);
  const [idOpen, setIdOpen] = useState(true);
  const [scannedAt, setScannedAt] = useState("");

  useEffect(() => {
    setScannedAt(new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    let active = true;
    (async () => {
      try {
        const res = await tagService.getPublic(code);
        if (active) setPet(res.status === "ACTIVE" ? res.pet : null);
      } catch {
        if (active) setPet(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    // Chủ pet (đã đăng nhập) → mở khoá "View Full Pet Passport"
    if (typeof window !== "undefined" && localStorage.getItem("pawtag_token")) {
      petService.getAll()
        .then((pets) => { if (active) setIsOwner(pets.some((p) => p.tagCode?.toUpperCase() === code.toUpperCase())); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [code]);

  function handleSendLocation(found = false) {
    if (!navigator.geolocation) { setLocState("denied"); return; }
    setLocState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try { await scanService.recordScan(code, lat, lng, found); } catch { /* vẫn báo thành công */ }
        setLocState("shared");
      },
      () => setLocState("denied"),
      { timeout: 8000 },
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center"><Loader2 size={32} className="text-[#4A8FE8] animate-spin" /></div>;
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-5 gap-5">
        <div className="w-20 h-20 rounded-full bg-[#FEF2F2] flex items-center justify-center"><PawPrint size={32} className="text-[#EF4444]" /></div>
        <div className="text-center">
          <h1 className="text-[22px] font-black text-[#1A2332] font-display">Tag Not Found</h1>
          <p className="text-[13px] text-[#6B7A8D] font-body mt-2">No pet is linked to tag <span className="font-mono font-bold text-[#1A2332]">{code}</span></p>
        </div>
        <Link href="/" className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta">Learn about PawsTag</Link>
      </div>
    );
  }

  const photo = pet.photo ?? FALLBACK_PHOTO;
  const isLost = pet.status === "lost";
  const genderLabel = pet.gender === "male" ? "Male ♂" : pet.gender === "female" ? "Female ♀" : "—";

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
            <button type="button" aria-label="Share" className="w-11 h-11 rounded-full bg-white/90 backdrop-blur flex items-center justify-center active:scale-90"><Share2 size={18} className="text-[#1A2332]" /></button>
          </div>
        </div>
        <div className="absolute bottom-20 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur">
          <PawPrint size={13} className="text-[#4A8FE8]" />
          <span className="text-[13px] font-bold text-[#4A8FE8] font-display">PawsTag</span>
        </div>
      </div>

      <div className="px-5 -mt-6 flex flex-col gap-4 pb-10">

        {/* ── Lost banner ── */}
        {isLost && (
          <div className="rounded-3xl px-5 py-4 flex items-center gap-3 shadow-emergency bg-gradient-to-r from-[#EF4444] to-[#FF7B35]">
            <AlertTriangle size={32} color="#fff" className="shrink-0 animate-pulse-slow" />
            <div>
              <p className="text-[18px] font-black text-white font-display tracking-wide">LOST PET — PLEASE HELP!</p>
              <p className="text-white/90 text-[14px] font-body">{pet.lostMessage || `Please help ${pet.name} get home.`} 🙏</p>
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
            {locState === "loading" ? <Loader2 size={20} className="animate-spin" /> : "🐾"} I Found This Pet — Notify Owner
          </button>
        )}

        {/* ── Name ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[40px] font-black text-[#1A2332] font-display leading-none">{pet.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[15px] text-[#6B7A8D] font-body">
              <span>🦮 {pet.breed}</span>
              {pet.gender && <><span className="text-[#C5CFD9]">•</span><span>{genderLabel}</span></>}
              {pet.age && <><span className="text-[#C5CFD9]">•</span><span>{pet.age} old</span></>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex gap-0.5 justify-end">{[...Array(5)].map((_, i) => <span key={i} className="text-[#F59E0B] text-[14px]">★</span>)}</div>
            <p className="text-[12px] text-[#9BAABB] font-body mt-1">Verified<br />Tag</p>
          </div>
        </div>

        {/* ── Owner's Message ── */}
        {pet.emergencyMessage && (
          <div className="rounded-2xl p-4 bg-[#FFF7F0] border-l-4 border-[#FF7B35]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[20px]">{isLost ? "💔" : "💬"}</span>
              <p className="text-[15px] font-extrabold text-[#1A2332] font-display">Owner&apos;s Message</p>
            </div>
            <p className="text-[15px] text-[#1A2332] font-body leading-relaxed">&ldquo;{pet.emergencyMessage}&rdquo;</p>
          </div>
        )}

        {/* ── Contact buttons ── */}
        <div className="flex flex-col gap-3">
          {pet.phone && (
            <a href={`tel:${pet.phone}`} className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-gradient-to-r from-[#22C55E] to-[#52C97F] shadow-call active:scale-[0.98] transition-all">
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Phone size={22} color="#fff" /></span>
              <div className="flex-1"><p className="text-white font-black text-[18px] font-display">📞 Call Owner</p><p className="text-white/80 text-[14px] font-body">{pet.phone}</p></div>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ArrowRight size={18} color="#fff" /></span>
            </a>
          )}
          {pet.phone && (
            <a href={`https://zalo.me/${pet.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-gradient-to-r from-[#4A8FE8] to-[#6BA6F0] shadow-zalo active:scale-[0.98] transition-all">
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><MessageCircle size={22} color="#fff" /></span>
              <div className="flex-1"><p className="text-white font-black text-[18px] font-display">💬 Message via Zalo</p><p className="text-white/80 text-[14px] font-body">Send a quick message</p></div>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ArrowRight size={18} color="#fff" /></span>
            </a>
          )}

          {locState === "shared" ? (
            <div className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-[#EDF7F2] border-2 border-[#22C55E]">
              <span className="w-12 h-12 rounded-2xl bg-[#22C55E]/20 flex items-center justify-center shrink-0"><Check size={22} className="text-[#22C55E]" /></span>
              <div className="flex-1"><p className="text-[#22C55E] font-black text-[16px] font-display">Location Sent!</p><p className="text-[#6B7A8D] text-[13px] font-body">{coords ? `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°` : "GPS shared with owner"}</p></div>
            </div>
          ) : locState === "denied" ? (
            <div className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-[#FEF2F2] border-2 border-[#EF4444]">
              <span className="w-12 h-12 rounded-2xl bg-[#EF4444]/20 flex items-center justify-center shrink-0"><MapPin size={22} className="text-[#EF4444]" /></span>
              <div className="flex-1"><p className="text-[#EF4444] font-bold text-[15px] font-display">Location unavailable</p><p className="text-[#6B7A8D] text-[13px] font-body">Please allow location access</p></div>
            </div>
          ) : (
            <button type="button" onClick={() => handleSendLocation(false)} disabled={locState === "loading"} className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-gradient-to-r from-[#FF7B35] to-[#FFAB7A] shadow-loc active:scale-[0.98] transition-all disabled:opacity-80">
              <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">{locState === "loading" ? <Loader2 size={22} color="#fff" className="animate-spin" /> : <MapPin size={22} color="#fff" />}</span>
              <div className="flex-1 text-left"><p className="text-white font-black text-[18px] font-display">📍 Send My Location</p><p className="text-white/80 text-[14px] font-body">{locState === "loading" ? "Getting location..." : "Share your GPS with owner"}</p></div>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ArrowRight size={18} color="#fff" /></span>
            </button>
          )}
        </div>

        {/* ── Pet Passport ── */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 bg-gradient-to-r from-[#EEF5FF] to-[#EDF7F2]"><span className="text-[18px]">📋</span><p className="text-[16px] font-extrabold text-[#1A2332] font-display">Pet Passport</p></div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <PassportCell emoji="🦮" label="Breed"       value={pet.breed || "—"} />
            <PassportCell emoji="🎂" label="Age"         value={pet.age ? `${pet.age} old` : "—"} />
            <PassportCell emoji="⚥" label="Gender"      value={genderLabel} />
            <PassportCell emoji="💉" label="Vaccination" value={pet.vaccinated ? "Up to date ✅" : "Not recorded"} />
            <PassportCell emoji="⚖️" label="Weight"      value={pet.weight ? `${pet.weight} kg` : "—"} />
            <PassportCell emoji="🎨" label="Color"       value={pet.color || "—"} />
          </div>
        </div>

        {/* ── Medical Notes ── */}
        <Section emoji="🏥" title="Medical Notes" open={medOpen} onToggle={() => setMedOpen(!medOpen)} headerBg="from-[#FFF7F0] to-[#FFF0E8]">
          <Field label="Allergies"     value={pet.medical.allergies || "No known allergies"} ok />
          <Field label="Last Vet Visit" value={pet.medical.lastVetVisit ? `${formatDate(pet.medical.lastVetVisit)}${pet.medical.vetName ? ` — ${pet.medical.vetName}` : ""}` : "Not recorded"} ok={!!pet.medical.lastVetVisit} />
          {pet.medical.medications && <Field label="Medications" value={pet.medical.medications} />}
          <Field label="Special Needs" value={pet.medical.conditions || "None"} ok />
          {pet.medical.bloodType && <Field label="Blood Type" value={pet.medical.bloodType} />}
        </Section>

        {/* ── Identification Notes ── */}
        <Section emoji="🔍" title="Identification Notes" open={idOpen} onToggle={() => setIdOpen(!idOpen)} headerBg="from-[#EDF7F2] to-[#EEF5FF]">
          {pet.color && <Field label="Coloring" value={pet.color} />}
          {pet.collar && <Field label="Collar" value={pet.collar} />}
          {pet.medical.microchipId && <Field label="Microchip ID" value={pet.medical.microchipId} mono />}
          {pet.identificationNotes && <Field label="Distinguishing Marks" value={pet.identificationNotes} />}
        </Section>

        {/* ── View Full Passport — CHỦ PET ONLY ── */}
        {isOwner && (
          <Link href="/passport" className="rounded-3xl px-4 py-4 flex items-center gap-4 bg-gradient-to-r from-[#1A2332] to-[#2A6B47] active:scale-[0.98] transition-all">
            <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 text-[22px]">📋</span>
            <div className="flex-1 min-w-0"><p className="text-white font-black text-[17px] font-display">View Full Pet Passport</p><p className="text-white/75 text-[13px] font-body">Vaccinations, health records &amp; travel docs</p></div>
            <ArrowRight size={20} color="#fff" className="shrink-0" />
          </Link>
        )}

        {/* ── Verified ── */}
        <div className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-br from-[#EEF5FF] to-[#EDF7F2] border border-[rgba(74,143,232,0.15)]">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-cta shrink-0"><Shield size={24} color="#fff" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold text-[#1A2332] font-display flex items-center gap-1">✅ Verified by PawsTag</p>
            <p className="text-[13px] text-[#6B7A8D] font-body">Profile authenticated &amp; secured</p>
            <p className="text-[12px] text-[#9BAABB] font-mono mt-1">Secure ID: PT-2025-{pet.name.toUpperCase()}-001</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pt-2">
          <p className="flex items-center justify-center gap-1.5 text-[16px] font-bold font-display"><PawPrint size={16} className="text-[#4A8FE8]" /><span className="text-[#4A8FE8]">PawsTag</span></p>
          <p className="text-[13px] text-[#9BAABB] font-body mt-1">Helping pets find their way home since 2024</p>
          {scannedAt && <p className="text-[12px] text-[#C5CFD9] font-body mt-1">Scanned at {scannedAt}</p>}
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
