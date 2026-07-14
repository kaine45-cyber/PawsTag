"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Download, Share2, Shield, CheckCircle2, Check,
  Loader2, AlertTriangle, Phone, MapPin, Plus, Trash2,
} from "lucide-react";
import { passportService, type PassportData } from "@/services/passport.service";
import { Avatar } from "@/components/ui/Avatar";
import { exportSectionsToPdf } from "@/lib/pdf";
import { shareOrCopy } from "@/lib/share";
import { useI18n } from "@/i18n/LanguageContext";
import { formatAge } from "@/utils/formatter";

const FALLBACK = "/images/corgi.jpg";
type Tab = "Profile" | "Health" | "Travel";

// Emoji cho từng mục checklist du lịch (khớp code trung tính từ backend).
const TRAVEL_EMOJI: Record<string, string> = {
  RABIES: "💉", MICROCHIP: "💾", HEALTH_CERT: "📋", DEWORMING: "🔍", PARASITE: "🐛",
};

export default function PassportPage() {
  const { pets } = useAuth();
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("Profile");
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const pet = pets[idx];

  async function savePdf() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await exportSectionsToPdf(exportRef.current, "[data-export-page]", `${pet?.name ?? "pet"}-passport.pdf`);
    } catch { /* ignore */ } finally {
      setExporting(false);
    }
  }
  async function share() {
    await shareOrCopy({
      title: `${pet?.name ?? "Pet"}'s Pet Passport`,
      text: `${pet?.name ?? "My pet"}'s official PawsTag passport`,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }

  useEffect(() => {
    let on = true;

    async function loadPassport() {
      if (!pet) {
        if (on) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const d = await passportService.get(pet.id);
        if (on) setData(d);
      } catch {
        if (on) setData(null);
      } finally {
        if (on) setLoading(false);
      }
    }

    loadPassport();
    return () => { on = false; };
  }, [pet]);

  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-5">
        <span className="text-[40px]">📋</span>
        <p className="text-[16px] font-bold text-[#6B7A8D] font-display">{t("pp.noPets")}</p>
        <Link href="/pet/create" className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta">{t("pp.addPet")}</Link>
      </div>
    );
  }

  return (
    <div ref={pdfRef} className="flex flex-col min-h-full bg-[#F7F9FC]">

      {/* ── Passport card ── */}
      <div className="px-4 pt-4">
        <div className="relative rounded-3xl overflow-hidden p-5 bg-gradient-to-br from-[#1A2A4A] via-[#2C5364] to-[#2A6B47] shadow-card-md">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute top-10 right-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative flex items-center justify-between mb-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:scale-90"><ArrowLeft size={18} color="#fff" /></Link>
            <div className="flex gap-2" data-html2canvas-ignore>
              <button type="button" onClick={savePdf} disabled={exporting} aria-label="Download" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:scale-90 disabled:opacity-60">{exporting ? <Loader2 size={17} color="#fff" className="animate-spin" /> : <Download size={17} color="#fff" />}</button>
              <button type="button" onClick={share} aria-label="Share" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:scale-90"><Share2 size={17} color="#fff" /></button>
            </div>
          </div>

          <div className="relative flex gap-4">
            <div className="relative shrink-0">
              <img src={(pet?.photo) ?? FALLBACK} alt={pet?.name} className="w-[104px] h-[104px] rounded-2xl object-cover border-2 border-[#D4AF37]/60" />
              <span className="absolute -bottom-2 -right-2 w-11 h-11 rounded-full bg-[#F5C518] flex items-center justify-center text-[18px]">🐾</span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[#F5C518] text-[13px] font-extrabold font-display tracking-[0.15em]">PET PASSPORT</p>
              <p className="text-white text-[30px] font-black font-display leading-none mt-1">{pet?.name}</p>
              <p className="text-white/70 text-[14px] font-body">{pet?.breed || "—"}</p>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2 mt-4">
            <div>
              <p className="text-[#F5C518]/90 text-[11px] font-bold font-display tracking-wide">PASSPORT NO.</p>
              <p className="text-white text-[15px] font-bold font-mono">{data?.passportNo ?? "—"}</p>
            </div>
            <div>
              <p className="text-[#F5C518]/90 text-[11px] font-bold font-display tracking-wide">ISSUED</p>
              <p className="text-white text-[15px] font-bold font-display">{data?.issued ?? "—"}</p>
            </div>
          </div>

          <p className="relative text-white/40 text-[12px] font-mono mt-4 tracking-wider truncate">{data?.mrz ?? ""}</p>
        </div>
      </div>

      {/* ── Pet switcher ── */}
      {pets.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto hide-scrollbar">
          {pets.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setIdx(i)} className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold font-display ${i === idx ? "gradient-brand text-white shadow-cta" : "bg-white text-[#6B7A8D] shadow-card"}`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#EEF2FB]">
        {(["Profile", "Health", "Travel"] as Tab[]).map((tb) => (
          <button key={tb} type="button" onClick={() => setTab(tb)} className={`py-2.5 rounded-xl text-[14px] font-bold font-display transition-all ${tab === tb ? "bg-white text-[#4A8FE8] shadow-card" : "text-[#9BAABB]"}`}>
            {tb === "Profile" ? "🐾" : tb === "Health" ? "🏥" : "✈️"} {tb === "Profile" ? t("pp.profile") : tb === "Health" ? t("pp.health") : t("pp.travel")}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {loading || !data ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={28} className="text-[#4A8FE8] animate-spin" /></div>
        ) : tab === "Profile" ? (
          <ProfileTab data={data} />
        ) : tab === "Health" ? (
          <HealthTab data={data} petId={pet.id} onUpdate={setData} onSave={savePdf} onShare={share} exporting={exporting} />
        ) : (
          <TravelTab data={data} onSave={savePdf} onShare={share} exporting={exporting} />
        )}
      </div>

      {/* ── Vùng export ẩn ngoài màn hình (chụp PDF ngầm cả 3 tab) ── */}
      <div ref={exportRef} aria-hidden className="fixed top-0 -left-[10000px] w-[440px] pointer-events-none">
        {data && pet && (
          <>
            <div data-export-page className="bg-[#F7F9FC] p-4 flex flex-col gap-4">
              <ExportHeader pet={pet} data={data} section="Profile" />
              <ProfileTab data={data} />
            </div>
            <div data-export-page className="bg-[#F7F9FC] p-4 flex flex-col gap-4">
              <ExportHeader pet={pet} data={data} section="Health" />
              <HealthTab data={data} petId={pet.id} onUpdate={() => {}} onSave={() => {}} onShare={() => {}} exporting />
            </div>
            <div data-export-page className="bg-[#F7F9FC] p-4 flex flex-col gap-4">
              <ExportHeader pet={pet} data={data} section="Travel" />
              <TravelTab data={data} onSave={() => {}} onShare={() => {}} exporting />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ExportHeader({ pet, data, section }: { pet: { name: string; breed: string; photo: string | null }; data: PassportData; section: string }) {
  return (
    <div className="rounded-3xl overflow-hidden p-5 bg-gradient-to-br from-[#1A2A4A] via-[#2C5364] to-[#2A6B47]">
      <div className="flex gap-4">
        <img src={pet.photo ?? FALLBACK} alt="" className="w-[88px] h-[88px] rounded-2xl object-cover border-2 border-[#D4AF37]/60" />
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-[#F5C518] text-[12px] font-extrabold font-display tracking-[0.15em]">PET PASSPORT · {section.toUpperCase()}</p>
          <p className="text-white text-[26px] font-black font-display leading-none mt-1">{pet.name}</p>
          <p className="text-white/70 text-[13px] font-body">{pet.breed || "—"}</p>
          <p className="text-white/85 text-[12px] font-mono mt-2">{data.passportNo} · {data.issued}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Profile ── */
function ProfileTab({ data }: { data: PassportData }) {
  const { t, lang } = useI18n();
  return (
    <>
      <VerifiedCard title={t("pp.verifiedTitle")} sub={t("pp.verifiedSub")} />

      <Card>
        <CardHeader emoji="🆔" title={t("pp.identity")} bg="from-[#F3F0FF] to-[#EEF5FF]" />
        <Row label={t("pp.fullName")} value={data.identity.fullName} note={t("pp.registeredName")} />
        <Row label={t("pp.species")} value={data.identity.species} />
        <Row label={t("pp.breed")} value={data.identity.breed} />
        <Row label={t("pp.dob")} value={data.identity.dateOfBirth} />
        <Row label={t("pp.age")} value={formatAge(data.identity.ageMonths, lang)} />
        <Row label={t("pp.weight")} value={data.identity.weight} />
        {data.identity.primaryColor && <Row label={t("pp.primaryColor")} value={data.identity.primaryColor} />}
        {data.identity.eyeColor && <Row label={t("pp.eyeColor")} value={data.identity.eyeColor} last />}
      </Card>

      <Card>
        <CardHeader emoji="💾" title={t("pp.microchipSection")} bg="from-[#FFF7F0] to-[#FFF0E8]" />
        {data.microchip.microchipId && <Row label={t("pp.microchipId")} value={data.microchip.microchipId} mono />}
        {data.microchip.implantDate && <Row label={t("pp.implantDate")} value={data.microchip.implantDate} />}
        {data.microchip.implantLocation && <Row label={t("pp.implantLocation")} value={data.microchip.implantLocation} />}
        <Row label={t("pp.pawstagId")} value={data.microchip.pawstagId} mono last />
      </Card>

      <Card>
        <CardHeader emoji="👤" title={t("pp.ownerInfo")} bg="from-[#EDF7F2] to-[#EEF5FF]" />
        <div className="p-4 flex items-center gap-3">
          <Avatar src={data.owner.avatar} name={data.owner.name} className="w-14 h-14 rounded-full shrink-0" textCls="text-[20px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold text-[#1A2332] font-display">{data.owner.name}</p>
            {data.owner.phone && <p className="text-[13px] text-[#6B7A8D] font-body flex items-center gap-1"><Phone size={12} className="text-[#EF4444]" /> {data.owner.phone}</p>}
            {data.owner.city && <p className="text-[13px] text-[#6B7A8D] font-body flex items-center gap-1"><MapPin size={12} className="text-[#EF4444]" /> {data.owner.city}</p>}
          </div>
          <CheckCircle2 size={22} className="text-[#22C55E] shrink-0" />
        </div>
      </Card>
    </>
  );
}

/* ── Health ── */
function HealthTab({ data, petId, onUpdate, onSave, onShare, exporting }: { data: PassportData; petId: string; onUpdate: (d: PassportData) => void; onSave: () => void; onShare: () => void; exporting: boolean }) {
  const { t } = useI18n();
  const [vaccOpen, setVaccOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vacc, setVacc] = useState({ name: "", givenDate: "", dueDate: "" });
  const [visit, setVisit] = useState({ vetName: "", clinic: "", note: "", visitDate: "" });

  async function addVacc() {
    if (!vacc.name.trim()) return;
    setBusy(true);
    try {
      onUpdate(await passportService.addVaccination(petId, { name: vacc.name.trim(), givenDate: vacc.givenDate || undefined, dueDate: vacc.dueDate || undefined }));
      setVaccOpen(false); setVacc({ name: "", givenDate: "", dueDate: "" });
    } catch { /* ignore */ } finally { setBusy(false); }
  }
  async function delVacc(id: string) { try { onUpdate(await passportService.deleteVaccination(petId, id)); } catch { /* ignore */ } }
  async function addVisit() {
    setBusy(true);
    try {
      onUpdate(await passportService.addVetVisit(petId, { vetName: visit.vetName || undefined, clinic: visit.clinic || undefined, note: visit.note || undefined, visitDate: visit.visitDate || undefined }));
      setVisitOpen(false); setVisit({ vetName: "", clinic: "", note: "", visitDate: "" });
    } catch { /* ignore */ } finally { setBusy(false); }
  }
  async function delVisit(id: string) { try { onUpdate(await passportService.deleteVetVisit(petId, id)); } catch { /* ignore */ } }

  const mField = "w-full h-[46px] px-4 rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.12)] text-[14px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white";

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <StatBox value={`${data.health.vaccinesValid}/${data.health.vaccinesTotal}`} label={t("pp.vaccines")} sub={data.health.vaccinesTotal > 0 ? t("pp.upToDate") : t("pp.noneRecorded")} color={data.health.vaccinesTotal > 0 ? "text-[#22C55E]" : "text-[#9BAABB]"} />
        <StatBox value={String(data.health.vetVisitsThisYear)} label={t("pp.vetVisitsStat")} sub={t("pp.thisYear")} color="text-[#4A8FE8]" />
        <StatBox value={data.vaccinations.length > 0 || data.vetVisits.length > 0 ? `${data.health.healthScore}%` : "—"} label={t("pp.healthScore")} sub={data.vaccinations.length === 0 && data.vetVisits.length === 0 ? t("pp.noHealthData") : data.health.healthScore >= 90 ? t("pp.excellent") : data.health.healthScore >= 75 ? t("pp.good") : t("pp.fair")} color="text-[#FF7B35]" />
      </div>

      <Card>
        <CardHeader emoji="💉" title={t("pp.vaccRecord")} bg="from-[#EDF7F2] to-[#EEF5FF]" action={<AddBtn onClick={() => setVaccOpen(true)} />} />
        <div className="divide-y divide-[#F0F4FA]">
          {data.vaccinations.length === 0 ? <Empty text={t("pp.noVacc")} /> :
            data.vaccinations.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${v.status === "Valid" ? "bg-[#EDF7F2]" : v.status === "Expiring" ? "bg-[#FFF7E8]" : "bg-[#FEF2F2]"}`}>
                  {v.status === "Expiring" ? <AlertTriangle size={18} className="text-[#F59E0B]" /> : <Check size={18} className={v.status === "Valid" ? "text-[#22C55E]" : "text-[#EF4444]"} strokeWidth={3} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-extrabold text-[#1A2332] font-display">{v.name}</p>
                  <p className="text-[12px] text-[#9BAABB] font-body">{t("pp.given")}: {v.given} · {t("pp.due")}: {v.due}</p>
                </div>
                <span className={`text-[12px] font-bold font-display ${v.status === "Valid" ? "text-[#22C55E]" : v.status === "Expiring" ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>{t(`pp.vs.${v.status}`)}</span>
                <button type="button" aria-label="Delete vaccination" onClick={() => delVacc(v.id)} className="shrink-0"><Trash2 size={16} className="text-[#C5CFD9]" /></button>
              </div>
            ))}
        </div>
      </Card>

      <Card>
        <CardHeader emoji="🩺" title={t("pp.vetHistory")} bg="from-[#EEF5FF] to-[#EDF7F2]" action={<AddBtn onClick={() => setVisitOpen(true)} />} />
        <div className="divide-y divide-[#F0F4FA]">
          {data.vetVisits.length === 0 ? <Empty text={t("pp.noVisits")} /> :
            data.vetVisits.map((v) => (
              <div key={v.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-extrabold text-[#1A2332] font-display">{v.vetName || t("pp.vetVisit")}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-[#9BAABB] font-body">{v.date}</p>
                    <button type="button" aria-label="Delete vet visit" onClick={() => delVisit(v.id)}><Trash2 size={15} className="text-[#C5CFD9]" /></button>
                  </div>
                </div>
                {v.clinic && <p className="text-[13px] text-[#6B7A8D] font-body">{v.clinic}</p>}
                {v.note && <p className="text-[13px] text-[#9BAABB] font-body italic mt-0.5">&ldquo;{v.note}&rdquo;</p>}
              </div>
            ))}
        </div>
      </Card>

      <Card>
        <CardHeader emoji="📋" title={t("pp.medicalNotes")} bg="from-[#FFF7F0] to-[#FFF0E8]" />
        <div className="p-4 grid grid-cols-2 gap-3">
          <MedCell emoji="🩸" label={t("pp.bloodType")} value={data.medical.bloodType || "—"} />
          <MedCell emoji="⚖️" label={t("pp.idealWeight")} value={data.medical.idealWeight} />
          <MedCell emoji="🚫" label={t("pp.allergies")} value={data.medical.allergies || t("pp.allergiesNone")} />
          <MedCell emoji="💊" label={t("pp.medications")} value={data.medical.medications || t("pp.medsNone")} />
          <MedCell emoji="🧬" label={t("pp.neutered")} value={data.medical.neutered ? t("pp.neuteredYes") + (data.medical.neuteredDate ? ` (${data.medical.neuteredDate})` : "") : t("pp.neuteredNo")} />
          <MedCell emoji="❤️" label={t("pp.diet")} value={data.medical.diet || "—"} />
        </div>
      </Card>

      <SaveShare onSave={onSave} onShare={onShare} exporting={exporting} />

      {/* Add Vaccination modal */}
      {vaccOpen && (
        <Sheet title={t("pp.addVacc")} onClose={() => setVaccOpen(false)}>
          <input className={mField} placeholder={t("pp.vaccName")} value={vacc.name} onChange={(e) => setVacc({ ...vacc, name: e.target.value })} aria-label="Vaccine name" />
          <label className="text-[12px] text-[#9BAABB] font-body">{t("pp.givenDate")}</label>
          <input type="date" className={mField} value={vacc.givenDate} onChange={(e) => setVacc({ ...vacc, givenDate: e.target.value })} aria-label="Given date" />
          <label className="text-[12px] text-[#9BAABB] font-body">{t("pp.dueDate")}</label>
          <input type="date" className={mField} value={vacc.dueDate} onChange={(e) => setVacc({ ...vacc, dueDate: e.target.value })} aria-label="Due date" />
          <SheetSave busy={busy} disabled={!vacc.name.trim()} onClick={addVacc} />
        </Sheet>
      )}

      {/* Add Vet Visit modal */}
      {visitOpen && (
        <Sheet title={t("pp.addVisit")} onClose={() => setVisitOpen(false)}>
          <input className={mField} placeholder={t("pp.vetName")} value={visit.vetName} onChange={(e) => setVisit({ ...visit, vetName: e.target.value })} aria-label="Vet name" />
          <input className={mField} placeholder={t("pp.clinic")} value={visit.clinic} onChange={(e) => setVisit({ ...visit, clinic: e.target.value })} aria-label="Clinic" />
          <input className={mField} placeholder={t("pp.note")} value={visit.note} onChange={(e) => setVisit({ ...visit, note: e.target.value })} aria-label="Note" />
          <label className="text-[12px] text-[#9BAABB] font-body">{t("pp.visitDate")}</label>
          <input type="date" className={mField} value={visit.visitDate} onChange={(e) => setVisit({ ...visit, visitDate: e.target.value })} aria-label="Visit date" />
          <SheetSave busy={busy} disabled={false} onClick={addVisit} />
        </Sheet>
      )}
    </>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return <button type="button" onClick={onClick} data-html2canvas-ignore className="flex items-center gap-1 text-[13px] font-bold text-[#4A8FE8] font-display"><Plus size={16} /> {t("pp.add")}</button>;
}
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-[480px] p-6 pb-8 shadow-form flex flex-col gap-2.5 max-h-[85vh] overflow-y-auto">
        <p className="text-[18px] font-black text-[#1A2332] font-display mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}
function SheetSave({ busy, disabled, onClick }: { busy: boolean; disabled: boolean; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" onClick={onClick} disabled={busy || disabled} className="mt-2 py-3.5 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta active:scale-95 disabled:opacity-60">
      {busy ? t("pp.savingShort") : t("pp.save")}
    </button>
  );
}

/* ── Travel ── */
function TravelTab({ data, onSave, onShare, exporting }: { data: PassportData; onSave: () => void; onShare: () => void; exporting: boolean }) {
  const { t } = useI18n();
  const allOk = data.travel.every((item) => item.status === "ok");
  return (
    <>
      <div className="rounded-3xl px-5 py-4 flex items-center gap-4 bg-gradient-to-br from-[#1A2A4A] to-[#2A6B47]">
        <span className="text-[34px] shrink-0">✈️</span>
        <div className="flex-1">
          <p className="text-white font-black text-[18px] font-display">{allOk ? t("pp.travelReady") : t("pp.almostReady")}</p>
          <p className="text-white/75 text-[13px] font-body">{t("pp.meetsReq").replace("{name}", data.name)}</p>
        </div>
        <CheckCircle2 size={26} className="text-[#22C55E] shrink-0" />
      </div>

      {data.travel.map((item, i) => (
        <div key={i} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-card">
          <span className="text-[24px] shrink-0">{TRAVEL_EMOJI[item.code] ?? "📄"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold text-[#1A2332] font-display">{t(`pp.tv.${item.code}`)}</p>
            <p className="text-[13px] text-[#9BAABB] font-body">{t(`pp.tvd.${item.detailCode}`).replace("{value}", item.detailValue ?? "")}</p>
          </div>
          {item.status === "ok"
            ? <span className="w-7 h-7 rounded-md bg-[#22C55E] flex items-center justify-center shrink-0"><Check size={16} color="#fff" strokeWidth={3} /></span>
            : <AlertTriangle size={22} className="text-[#F59E0B] shrink-0" />}
        </div>
      ))}

      <div className="rounded-2xl bg-[#EEF5FF] p-4">
        <p className="text-[15px] font-bold text-[#4A8FE8] font-display mb-1">💡 {t("pp.travelTips")}</p>
        <p className="text-[13px] text-[#6B7A8D] font-body leading-relaxed">
          {t("pp.travelTipsText")}
        </p>
      </div>

      <SaveShare onSave={onSave} onShare={onShare} exporting={exporting} />
    </>
  );
}

/* ── Shared bits ── */
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-3xl shadow-card overflow-hidden">{children}</div>;
}
function CardHeader({ emoji, title, bg, action }: { emoji: string; title: string; bg: string; action?: React.ReactNode }) {
  return (
    <div className={`px-4 py-3 flex items-center justify-between bg-gradient-to-r ${bg}`}>
      <span className="flex items-center gap-2"><span className="text-[18px]">{emoji}</span><p className="text-[16px] font-extrabold text-[#1A2332] font-display">{title}</p></span>
      {action}
    </div>
  );
}
function Row({ label, value, note, mono, last }: { label: string; value: string; note?: string; mono?: boolean; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 px-4 py-3.5 ${last ? "" : "border-b border-[#F0F4FA]"}`}>
      <p className="text-[13px] font-bold text-[#9BAABB] font-display uppercase tracking-wide pt-0.5">{label}</p>
      <div className="text-right min-w-0">
        <p className={`text-[16px] font-bold text-[#1A2332] ${mono ? "font-mono text-[15px]" : "font-display"}`}>{value}</p>
        {note && <p className="text-[12px] text-[#C5CFD9] font-body">{note}</p>}
      </div>
    </div>
  );
}
function VerifiedCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-br from-[#EDF7F2] to-[#EEF5FF] border border-[rgba(74,143,232,0.12)]">
      <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-cta shrink-0"><Shield size={24} color="#fff" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-extrabold text-[#1A2332] font-display flex items-center gap-1">✅ {title}</p>
        <p className="text-[13px] text-[#6B7A8D] font-body">{sub}</p>
      </div>
      <CheckCircle2 size={22} className="text-[#22C55E] shrink-0" />
    </div>
  );
}
function StatBox({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-card text-center">
      <p className={`text-[24px] font-black font-display ${color}`}>{value}</p>
      <p className="text-[10px] text-[#9BAABB] font-display uppercase tracking-wide mt-0.5">{label}</p>
      <p className={`text-[11px] font-bold font-display ${color}`}>{sub}</p>
    </div>
  );
}
function MedCell({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="bg-[#F7F9FC] rounded-2xl p-3">
      <p className="flex items-center gap-1 text-[11px] font-bold text-[#9BAABB] font-display uppercase tracking-wide">{emoji} {label}</p>
      <p className="text-[15px] font-bold text-[#1A2332] font-display mt-1">{value}</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="px-4 py-6 text-center text-[13px] text-[#9BAABB] font-body">{text}</p>;
}
function SaveShare({ onSave, onShare, exporting }: { onSave: () => void; onShare: () => void; exporting: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3" data-html2canvas-ignore>
      <button type="button" onClick={onSave} disabled={exporting} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#4A8FE8] text-[#4A8FE8] font-bold font-display active:scale-95 disabled:opacity-60">
        {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} {exporting ? t("pp.exporting") : t("pp.savePdf")}
      </button>
      <button type="button" onClick={onShare} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta active:scale-95"><Share2 size={18} /> {t("pp.share")}</button>
    </div>
  );
}
