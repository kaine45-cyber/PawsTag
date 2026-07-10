"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ownerService, type NotifPrefs } from "@/services/owner.service";
import { Avatar } from "@/components/ui/Avatar";
import { useI18n } from "@/i18n/LanguageContext";
import type { Lang } from "@/i18n/messages";
import {
  Edit2, LogOut, Bell, Shield, HelpCircle, ChevronRight,
  PawPrint, MapPin, Phone, Mail, Star, Check, X, Eye, EyeOff, Languages,
} from "lucide-react";

type Modal = "password" | "notif" | "help" | null;

const inputClass =
  "w-full h-[48px] px-[16px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.15)] text-[14px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]";

export default function ProfilePage() {
  const { user, pets, logout, setUser } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.name  ?? "");
  const [phone,    setPhone]    = useState(user?.phone ?? "");
  const [city,     setCity]     = useState(user?.city  ?? "");
  const [saved,    setSaved]    = useState(false);
  const [modal,    setModal]    = useState<Modal>(null);

  async function handleSave() {
    try {
      const updated = await ownerService.update({ name, phone, city });
      setUser(updated);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* giữ form */ }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const f = input.files?.[0];
    if (!f) return;
    try {
      const updated = await ownerService.uploadAvatar(f);
      setUser(updated);
    } catch { /* ignore */ }
    finally { input.value = ""; }   // reset để chọn lại được (kể cả cùng file)
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const totalScans = pets.reduce((s, p) => s + p.totalScans, 0);

  return (
    <div className="flex flex-col min-h-full pb-8">

      {/* ── Header gradient ── */}
      <div className="gradient-brand px-5 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative flex items-center justify-between mb-5">
          <h1 className="text-[20px] font-black text-white font-display">{t("profile.title")}</h1>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-all active:scale-90"
          >
            {editing ? <X size={18} color="#fff" /> : <Edit2 size={16} color="#fff" />}
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name} className="w-20 h-20 rounded-full border-4 border-white/30" textCls="text-[28px]" />
            <label
              aria-label="Change avatar"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-card cursor-pointer"
            >
              <Edit2 size={12} className="text-[#4A8FE8]" />
              <input type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
            </label>
          </div>
          <div className="text-center">
            <p className="text-white font-black text-[20px] font-display">{user?.name ?? t("profile.owner")}</p>
            <p className="text-white/70 text-[13px] font-body">{user?.email ?? ""}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
            <Star size={12} fill="#F59E0B" className="text-[#F59E0B]" />
            <span className="text-[11px] font-bold text-white font-display">{t("profile.freePlan")}</span>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="relative z-10 grid grid-cols-3 gap-3 px-5 -mt-6">
        {[
          { label: t("profile.stats.pets"),  value: String(pets.length) },
          { label: t("profile.stats.scans"), value: String(totalScans)  },
          { label: t("profile.stats.tags"),  value: String(pets.length) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-card-md text-center">
            <p className="text-[20px] font-black text-[#4A8FE8] font-display">{value}</p>
            <p className="text-[10px] text-[#6B7A8D] font-body">{label}</p>
          </div>
        ))}
      </div>

      <div className="px-5 mt-5 flex flex-col gap-4">

        {/* ── Save confirmation ── */}
        {saved && (
          <div className="flex items-center gap-2 bg-[#EDF7F2] rounded-2xl px-4 py-3 shadow-card">
            <Check size={16} className="text-[#22C55E] shrink-0" />
            <p className="text-[13px] font-bold text-[#2A6B47] font-display">{t("profile.updated")}</p>
          </div>
        )}

        {/* ── Personal Info ── */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)]">
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("profile.personalInfo")}</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {editing ? (
              <>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7A8D] font-body mb-1">{t("profile.fullName")}</label>
                  <input type="text" aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7A8D] font-body mb-1">{t("profile.phone")}</label>
                  <input type="tel" aria-label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7A8D] font-body mb-1">{t("profile.city")}</label>
                  <input type="text" aria-label="City" value={city}  onChange={(e) => setCity(e.target.value)}  className={inputClass} />
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta transition-all active:scale-95"
                >
                  {t("profile.saveChanges")}
                </button>
              </>
            ) : (
              <>
                {[
                  { icon: Edit2,  label: t("profile.name"),  value: user?.name  ?? "—" },
                  { icon: Mail,   label: t("profile.email"), value: user?.email ?? "—" },
                  { icon: Phone,  label: t("profile.phone"), value: user?.phone ?? "—" },
                  { icon: MapPin, label: t("profile.city"),  value: user?.city  ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF5FF] flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-[#4A8FE8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#9BAABB] font-body">{label}</p>
                      <p className="text-[13px] font-bold text-[#1A2332] font-display truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── My Pets quick view ── */}
        {pets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)] flex items-center justify-between">
              <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("profile.myPets")}</p>
              <span className="text-[11px] font-bold text-[#4A8FE8] font-body">{pets.length} {t("profile.registered")}</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {pets.map((pet) => (
                <div key={pet.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF5FF] flex items-center justify-center shrink-0">
                    <PawPrint size={16} className="text-[#4A8FE8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1A2332] font-display">{pet.name}</p>
                    <p className="text-[11px] text-[#9BAABB] font-body">{pet.breed} · Tag: {pet.tagCode}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-body ${
                    pet.status === "lost" ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-[#EDF7F2] text-[#22C55E]"
                  }`}>
                    {pet.status === "lost" ? t("common.lost") : t("common.safe")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Language switcher ── */}
        <LanguageCard />

        {/* ── Settings ── */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)]">
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("profile.settings")}</p>
          </div>
          <div className="divide-y divide-[rgba(74,143,232,0.07)]">
            {[
              { icon: Bell,       label: t("settings.notif"),   desc: t("settings.notif.desc"),   open: "notif" as const },
              { icon: Shield,     label: t("settings.privacy"), desc: t("settings.privacy.desc"), open: "password" as const },
              { icon: HelpCircle, label: t("settings.help"),    desc: t("settings.help.desc"),    open: "help" as const },
            ].map(({ icon: Icon, label, desc, open }) => (
              <button
                key={label}
                type="button"
                onClick={() => setModal(open)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:bg-[#F7F9FC]"
              >
                <div className="w-9 h-9 rounded-xl bg-[#EEF5FF] flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-[#4A8FE8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#1A2332] font-display">{label}</p>
                  <p className="text-[11px] text-[#9BAABB] font-body">{desc}</p>
                </div>
                <ChevronRight size={15} className="text-[#C5CFD9] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Premium upsell ── */}
        <div className="gradient-premium rounded-2xl px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-white font-black text-[14px] font-display">{t("profile.upgradeTitle")}</p>
            <p className="text-white/80 text-[11px] font-body mt-0.5">{t("profile.upgradeDesc")}</p>
          </div>
          <button
            type="button"
            className="bg-white text-[#FF7B35] text-[12px] font-extrabold px-4 py-2 rounded-xl font-display shrink-0 active:scale-95 transition-all"
          >
            {t("profile.upgrade")}
          </button>
        </div>

        {/* ── Logout ── */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#EF4444] text-[#EF4444] font-bold text-[14px] font-display transition-all active:scale-95 active:bg-[#FEF2F2]"
        >
          <LogOut size={16} />
          {t("profile.signOut")}
        </button>

        <p className="text-center text-[11px] text-[#C5CFD9] font-body">PawsTag v1.0.0 · {t("profile.freePlan")}</p>
      </div>

      {modal === "password" && <PasswordModal onClose={() => setModal(null)} />}
      {modal === "notif" && <NotifModal onClose={() => setModal(null)} />}
      {modal === "help" && <HelpModal onClose={() => setModal(null)} />}
    </div>
  );
}

/* ── Modals ── */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-[480px] p-6 pb-8 shadow-form flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[18px] font-black text-[#1A2332] font-display">{title}</p>
          <button type="button" aria-label="Close" onClick={onClose}><X size={20} className="text-[#9BAABB]" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const modalInput =
  "w-full h-[50px] px-4 rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.15)] text-[15px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white";

function PasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (next.length < 8) { setMsg({ ok: false, text: t("modal.pwMin") }); return; }
    setBusy(true); setMsg(null);
    try {
      await ownerService.changePassword(cur, next);
      setMsg({ ok: true, text: t("modal.pwChanged") });
      setCur(""); setNext("");
      setTimeout(onClose, 1200);
    } catch (e) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      // Backend trả message tiếng Anh cố định → map sang i18n
      setMsg({ ok: false, text: m === "Current password is incorrect" ? t("modal.pwWrongCurrent") : t("modal.pwFailed") });
    } finally { setBusy(false); }
  }

  return (
    <Sheet title={t("modal.changePassword")} onClose={onClose}>
      <label className="text-[13px] font-semibold text-[#6B7A8D] font-body">{t("modal.currentPassword")}</label>
      <input type={show ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)} className={modalInput} aria-label="Current password" />
      <label className="text-[13px] font-semibold text-[#6B7A8D] font-body">{t("modal.newPassword")}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} className={`${modalInput} pr-12`} aria-label="New password" />
        <button type="button" onClick={() => setShow(!show)} aria-label="Toggle" className="absolute right-4 top-1/2 -translate-y-1/2">{show ? <EyeOff size={18} className="text-[#9BAABB]" /> : <Eye size={18} className="text-[#9BAABB]" />}</button>
      </div>
      {msg && <p className={`text-[13px] font-body ${msg.ok ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{msg.text}</p>}
      <button type="button" onClick={submit} disabled={busy || !cur || !next} className="mt-2 py-3.5 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta active:scale-95 disabled:opacity-60">
        {busy ? t("modal.saving") : t("modal.changePassword")}
      </button>
    </Sheet>
  );
}

/** Thẻ chọn ngôn ngữ EN/VI — đổi tức thì, lưu vào localStorage. */
function LanguageCard() {
  const { t, lang, setLang } = useI18n();
  const opts: { code: Lang; flag: string; label: string }[] = [
    { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
    { code: "en", flag: "🇬🇧", label: "English" },
  ];
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)] flex items-center gap-2">
        <Languages size={15} className="text-[#4A8FE8]" />
        <div>
          <p className="text-[14px] font-extrabold text-[#1A2332] font-display">{t("settings.language")}</p>
          <p className="text-[11px] text-[#9BAABB] font-body">{t("settings.language.desc")}</p>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {opts.map(({ code, flag, label }) => {
          const active = lang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold font-display transition-all active:scale-95 ${
                active
                  ? "bg-[#EEF5FF] text-[#4A8FE8] ring-2 ring-[#4A8FE8]"
                  : "bg-[#F7F9FC] text-[#6B7A8D]"
              }`}
            >
              <span className="text-[18px]">{flag}</span>
              {label}
              {active && <Check size={15} className="text-[#4A8FE8]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotifModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  useEffect(() => { ownerService.getNotifPrefs().then(setPrefs).catch(() => {}); }, []);

  async function toggle(key: keyof NotifPrefs) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try { await ownerService.updateNotifPrefs({ [key]: updated[key] }); } catch { setPrefs(prefs); }
  }

  const rows: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: "scans", label: t("notif.scans"), desc: t("notif.scans.desc") },
    { key: "lost", label: t("notif.lost"), desc: t("notif.lost.desc") },
    { key: "updates", label: t("notif.updates"), desc: t("notif.updates.desc") },
  ];

  return (
    <Sheet title={t("modal.notifTitle")} onClose={onClose}>
      {!prefs ? <p className="text-[13px] text-[#9BAABB] font-body py-4 text-center">{t("modal.loading")}</p> :
        rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div><p className="text-[15px] font-bold text-[#1A2332] font-display">{label}</p><p className="text-[12px] text-[#9BAABB] font-body">{desc}</p></div>
            <button type="button" onClick={() => toggle(key)} aria-label={label} className={`relative w-12 h-7 rounded-full shrink-0 transition-all ${prefs[key] ? "bg-[#4A8FE8]" : "bg-[#D8DEE9]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${prefs[key] ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        ))}
    </Sheet>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const faqs = [
    { q: "How does a PawsTag work?", a: "Each tag has a QR code (and NFC). When someone scans it, they see your pet's public profile and can contact you instantly." },
    { q: "Is my phone number public?", a: "Only if you allow it. You control what's shown via privacy settings — filtered on the server, never exposed otherwise." },
    { q: "What is Lost Pet Mode?", a: "It marks your pet as missing — scanners see a LOST alert and can report their location to you." },
    { q: "Need more help?", a: "Email support@pawstag.vn and we'll get back to you within 24 hours. 🐾" },
  ];
  return (
    <Sheet title={t("modal.helpTitle")} onClose={onClose}>
      {faqs.map(({ q, a }) => (
        <div key={q} className="border-b border-[#F0F4FA] pb-3">
          <p className="text-[15px] font-bold text-[#1A2332] font-display">{q}</p>
          <p className="text-[13px] text-[#6B7A8D] font-body mt-1 leading-relaxed">{a}</p>
        </div>
      ))}
    </Sheet>
  );
}
