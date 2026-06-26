"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle, MapPin, Share2, MessageCircle, ArrowLeft,
  Bell, Megaphone, Repeat, Eye, Check,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { petService } from "@/services/pet.service";
import { scanService } from "@/services/scan.service";

const FALLBACK = "https://images.unsplash.com/photo-1612940960267-77571294d37f?w=600&q=80";

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
  const router = useRouter();
  const pet = pets.find((p) => p.id === petId);

  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastScan, setLastScan] = useState<{ location: string; time: string } | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => { if (pet) setActive(pet.status === "lost"); }, [pet]);
  useEffect(() => {
    if (!pet) return;
    scanService.getHistory(pet.id).then((s) => { if (s[0]) setLastScan({ location: s[0].location, time: s[0].timeAgo }); }).catch(() => {});
  }, [pet]);

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-5">
        <AlertTriangle size={40} className="text-[#EF4444]" />
        <p className="text-[16px] font-bold text-[#1A2332] font-display">Pet not found</p>
        <Link href={ROUTES.petList} className="px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta">My Pets</Link>
      </div>
    );
  }

  const tagUrl = `${origin || "https://pawstag.vn"}/t/${pet.tagCode}`;
  const stats = demoStats(pet.id);

  async function setLost(next: boolean) {
    setActive(next);
    setSaving(true);
    try {
      await petService.setLostMode(pet!.id, { isLost: next, lostMessage: next ? `${pet!.name} is missing — please help!` : undefined });
      await refreshPets();
    } catch { setActive(!next); }
    finally { setSaving(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(tagUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`flex flex-col min-h-full ${active ? "bg-[#FDEEEC]" : "bg-[#F7F9FC]"}`}>

      {/* Header */}
      <header className={`px-5 pt-4 pb-4 ${active ? "bg-white border-b border-[#EF4444]/10" : "bg-white"}`}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label="Back" className="w-11 h-11 rounded-full bg-[#EEF2FB] flex items-center justify-center active:scale-90"><ArrowLeft size={18} className="text-[#1A2332]" /></button>
          <div>
            <h1 className={`text-[22px] font-black font-display leading-none flex items-center gap-2 ${active ? "text-[#EF4444]" : "text-[#1A2332]"}`}>
              {active && <span>🚨</span>}{active ? "Lost Pet Alert ACTIVE" : "Lost Pet Mode"}
            </h1>
            <p className="text-[13px] text-[#9BAABB] font-body mt-1">{active ? "Alert is broadcasting to the community" : "Activate to alert the community"}</p>
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
                  <AlertTriangle size={24} /> MISSING
                </span>
                <span className="px-4 py-2 rounded-full bg-black/60 text-white text-[14px] font-bold font-display">
                  {pet.name} • {pet.breed || "—"}{pet.age ? ` • ${pet.age.replace(" years", " yrs").replace(" year", " yr")}` : ""}
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
                {active && <span>🚨</span>}{active ? "ALERT ACTIVE" : "Lost Pet Alert"}
              </p>
              <p className="text-[14px] text-[#9BAABB] font-body mt-0.5">{active ? "Notifying nearby community members" : "Alert community when pet is missing"}</p>
            </div>
            <button type="button" onClick={() => setLost(!active)} disabled={saving} aria-label="Toggle lost mode" className={`relative w-16 h-9 rounded-full transition-all shrink-0 disabled:opacity-60 ${active ? "bg-[#EF4444]" : "bg-[#D8DEE9]"}`}>
              <span className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow transition-all ${active ? "translate-x-7" : "translate-x-0"}`} />
            </button>
          </div>

          {active && (
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#F0F4FA]">
              <Stat icon={<Megaphone size={20} className="text-[#EF4444]" />} value={stats.notified} label="Notified" />
              <Stat icon={<Repeat size={20} className="text-[#4A8FE8]" />} value={stats.sharing} label="Sharing" />
              <Stat icon={<Eye size={20} className="text-[#8B5CF6]" />} value={stats.reports} label="Reports" />
            </div>
          )}
        </div>

        {/* Last Known Location */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2"><MapPin size={18} className="text-[#4A8FE8]" /><p className="text-[16px] font-extrabold text-[#1A2332] font-display">Last Known Location</p></div>
          <div className="relative h-44 bg-gradient-to-br from-[#DCE6F5] to-[#DCEFE2]">
            <div className="absolute inset-0 map-grid" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><MapPin size={40} className="text-[#EF4444] drop-shadow" fill="#EF4444" /></div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[16px] font-bold text-[#1A2332] font-display">{lastScan?.location ?? "No location recorded yet"}</p>
              <p className="text-[13px] text-[#9BAABB] font-body">Last seen: {lastScan?.time ?? "—"}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#FEE2E2] text-[#EF4444] text-[13px] font-bold font-display">Live</span>
          </div>
        </div>

        {/* Share Alert */}
        <div>
          <p className="text-[18px] font-black text-[#1A2332] font-display mb-3">Share Alert 📣</p>
          <div className="grid grid-cols-2 gap-3">
            <a href={`https://zalo.me/share?text=LOST PET: ${pet.name}! ${tagUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EEF2FB] text-[#4A8FE8] font-bold font-display active:scale-95"><Share2 size={18} /> Share on Zalo</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tagUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EEF2FB] text-[#4A8FE8] font-bold font-display active:scale-95"><MessageCircle size={18} /> Share on Facebook</a>
            <button type="button" className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#FFF7F0] text-[#FF7B35] font-bold font-display active:scale-95"><Bell size={18} /> Neighborhood Alert</button>
            <button type="button" onClick={copyLink} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EDF7F2] text-[#22C55E] font-bold font-display active:scale-95">{copied ? <Check size={18} /> : <MapPin size={18} />} {copied ? "Copied!" : "Copy Location Link"}</button>
          </div>
        </div>

        {/* Bottom action */}
        {active ? (
          <div className="rounded-3xl bg-[#FBE3E0] p-4 flex flex-col gap-3">
            <p className="text-[15px] font-bold text-[#EF4444] font-display">Emergency Actions</p>
            <a href={`tel:${pet.phone ?? ""}`} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#EF4444] text-white font-extrabold text-[16px] font-display shadow-emergency active:scale-95">🐾 Found {pet.name}? Report Location</a>
            <button type="button" onClick={() => setLost(false)} disabled={saving} className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-[#EF4444] text-[#EF4444] font-bold text-[16px] font-display active:scale-95 disabled:opacity-60">✅ {pet.name} is Home — Deactivate Alert</button>
          </div>
        ) : (
          <button type="button" onClick={() => setLost(true)} disabled={saving} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#EF4444] to-[#FF7B35] text-white font-extrabold text-[18px] font-display shadow-emergency active:scale-95 disabled:opacity-70">
            {saving ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : "🚨"} Activate Lost Pet Alert
          </button>
        )}
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
