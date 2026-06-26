"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ownerService } from "@/services/owner.service";
import { Avatar } from "@/components/ui/Avatar";
import {
  Edit2, LogOut, Bell, Shield, HelpCircle, ChevronRight,
  PawPrint, MapPin, Phone, Mail, Star, Check, X,
} from "lucide-react";

const inputClass =
  "w-full h-[48px] px-[16px] rounded-2xl bg-[#F0F4FA] border border-[rgba(74,143,232,0.15)] text-[14px] text-[#1A2332] font-body outline-none focus:border-[#4A8FE8] focus:bg-white transition-all placeholder:text-[#9BAABB]";

export default function ProfilePage() {
  const { user, pets, logout, setUser } = useAuth();
  const router = useRouter();

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.name  ?? "");
  const [phone,    setPhone]    = useState(user?.phone ?? "");
  const [city,     setCity]     = useState(user?.city  ?? "");
  const [saved,    setSaved]    = useState(false);

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
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const updated = await ownerService.uploadAvatar(f);
      setUser(updated);
    } catch { /* ignore */ }
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
          <h1 className="text-[20px] font-black text-white font-display">My Profile</h1>
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
            <p className="text-white font-black text-[20px] font-display">{user?.name ?? "Pet Owner"}</p>
            <p className="text-white/70 text-[13px] font-body">{user?.email ?? ""}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
            <Star size={12} fill="#F59E0B" className="text-[#F59E0B]" />
            <span className="text-[11px] font-bold text-white font-display">Free Plan</span>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="relative z-10 grid grid-cols-3 gap-3 px-5 -mt-6">
        {[
          { label: "Pets",    value: String(pets.length) },
          { label: "Scans",   value: String(totalScans)  },
          { label: "Tags",    value: String(pets.length) },
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
            <p className="text-[13px] font-bold text-[#2A6B47] font-display">Profile updated!</p>
          </div>
        )}

        {/* ── Personal Info ── */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)]">
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">Personal Info</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {editing ? (
              <>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7A8D] font-body mb-1">Full Name</label>
                  <input type="text" aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7A8D] font-body mb-1">Phone</label>
                  <input type="tel" aria-label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#6B7A8D] font-body mb-1">City</label>
                  <input type="text" aria-label="City" value={city}  onChange={(e) => setCity(e.target.value)}  className={inputClass} />
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                {[
                  { icon: Edit2,  label: "Name",  value: user?.name  ?? "—" },
                  { icon: Mail,   label: "Email", value: user?.email ?? "—" },
                  { icon: Phone,  label: "Phone", value: user?.phone ?? "—" },
                  { icon: MapPin, label: "City",  value: user?.city  ?? "—" },
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
              <p className="text-[14px] font-extrabold text-[#1A2332] font-display">My Pets</p>
              <span className="text-[11px] font-bold text-[#4A8FE8] font-body">{pets.length} registered</span>
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
                    {pet.status === "lost" ? "LOST" : "Safe"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(74,143,232,0.1)]">
            <p className="text-[14px] font-extrabold text-[#1A2332] font-display">Settings</p>
          </div>
          <div className="divide-y divide-[rgba(74,143,232,0.07)]">
            {[
              { icon: Bell,       label: "Notifications",    desc: "Scan alerts, reminders"  },
              { icon: Shield,     label: "Privacy & Security",desc: "Password, 2FA"           },
              { icon: HelpCircle, label: "Help & Support",   desc: "FAQ, contact us"         },
            ].map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                type="button"
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
            <p className="text-white font-black text-[14px] font-display">Upgrade to Premium</p>
            <p className="text-white/80 text-[11px] font-body mt-0.5">Pet Passport, analytics, priority support</p>
          </div>
          <button
            type="button"
            className="bg-white text-[#FF7B35] text-[12px] font-extrabold px-4 py-2 rounded-xl font-display shrink-0 active:scale-95 transition-all"
          >
            Upgrade
          </button>
        </div>

        {/* ── Logout ── */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#EF4444] text-[#EF4444] font-bold text-[14px] font-display transition-all active:scale-95 active:bg-[#FEF2F2]"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        <p className="text-center text-[11px] text-[#C5CFD9] font-body">PawsTag v1.0.0 · Free Plan</p>
      </div>
    </div>
  );
}
