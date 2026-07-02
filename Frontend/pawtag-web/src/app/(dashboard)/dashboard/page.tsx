"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell, Search, Check, Tag, AlertTriangle, History, Settings,
  MapPin, Clock, ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { dashboardService, type DashboardData } from "@/services/dashboard.service";
import { Avatar } from "@/components/ui/Avatar";
import { useI18n } from "@/i18n/LanguageContext";
import { localizeRelativeTime } from "@/i18n/localizeNotification";

const FALLBACK_PET = "/images/corgi.jpg";

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "dash.greeting.morning";
  if (h < 18) return "dash.greeting.afternoon";
  return "dash.greeting.evening";
}

export default function DashboardPage() {
  const { user, pets } = useAuth();
  const { t } = useI18n();
  const [dash, setDash] = useState<DashboardData | null>(null);

  useEffect(() => {
    let on = true;
    dashboardService.get().then((d) => { if (on) setDash(d); }).catch(() => {});
    return () => { on = false; };
  }, []);

  const firstPetId = pets[0]?.id;
  const scansToday = dash?.stats.scansToday ?? 0;
  const totalPets  = dash?.stats.totalPets ?? pets.length;
  const lostActive = dash?.stats.lostModeActive ?? 0;

  const quickActions = [
    { href: firstPetId ? ROUTES.petTags(firstPetId) : ROUTES.petList, icon: Tag,           title: t("qa.manageTags"),  sub: t("qa.manageTags.sub"),  iconCls: "text-[#4A8FE8]", bgCls: "bg-[#EEF5FF]" },
    { href: firstPetId ? ROUTES.petLostMode(firstPetId) : ROUTES.petList, icon: AlertTriangle, title: t("qa.lostMode"), sub: t("qa.lostMode.sub"),    iconCls: "text-[#FF7B35]", bgCls: "bg-[#FFF7F0]" },
    { href: ROUTES.scanHistory, icon: History,  title: t("qa.scanHistory"), sub: t("qa.scanHistory.sub"), iconCls: "text-[#22C55E]", bgCls: "bg-[#EDF7F2]" },
    { href: ROUTES.profile,     icon: Settings, title: t("qa.petSettings"), sub: t("qa.petSettings.sub"), iconCls: "text-[#8B5CF6]", bgCls: "bg-[#F3F0FF]" },
  ];

  const recent = dash?.recentScans ?? [];

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header gradient ── */}
      <div className="gradient-brand px-5 pt-8 pb-8 rounded-b-[28px] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10" />
        </div>

        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="active:scale-90 transition-transform">
              <Avatar src={user?.avatar} name={user?.name} className="w-12 h-12 rounded-full border-2 border-white/50" textCls="text-[18px]" />
            </Link>
            <div>
              <p className="text-white/80 text-[13px] font-body">{t(greetingKey())} 👋</p>
              <p className="text-white font-black text-[19px] font-display">{user?.name ?? t("dash.owner")}</p>
            </div>
          </div>
          <Link href="/notifications" className="relative w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
            <Bell size={20} color="#fff" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-white" />
          </Link>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-2xl p-3 flex flex-col items-center text-center">
            <Search size={22} color="#fff" className="mb-1.5" />
            <p className="text-white font-black text-[22px] font-display leading-none">{scansToday}</p>
            <p className="text-white/85 text-[11px] font-display mt-1">{t("dash.scansToday")}</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-[20px] mb-0.5">🐾</span>
            <p className="text-white font-black text-[22px] font-display leading-none">{totalPets}</p>
            <p className="text-white/85 text-[11px] font-display mt-1">{t("dash.myPetsStat")}</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${lostActive > 0 ? "bg-[#EF4444]" : "bg-[#22C55E]"}`}>
              {lostActive > 0 ? <AlertTriangle size={18} color="#fff" /> : <Check size={18} color="#fff" strokeWidth={3} />}
            </div>
            <p className="text-white/90 text-[12px] font-bold font-display">
              {lostActive > 0 ? `${lostActive} ${t("dash.lost")}` : t("dash.allSafe")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pt-6 pb-4">

        {/* ── My Pets ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[20px] font-black text-[#1A2332] font-display">{t("dash.myPets")} 🐶</h2>
            <Link href={ROUTES.petCreate} className="text-[14px] text-[#4A8FE8] font-bold font-display">{t("dash.addPet")}</Link>
          </div>

          {pets.length === 0 ? (
            <Link href={ROUTES.petCreate} className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border-2 border-dashed border-[#4A8FE8]/30 bg-[#EEF5FF]/40">
              <span className="text-[28px]">🐾</span>
              <p className="text-[14px] font-bold text-[#4A8FE8] font-display">{t("dash.addFirstPet")}</p>
            </Link>
          ) : (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-5 px-5 snap-x">
              {pets.map((pet) => (
                <Link key={pet.id} href={ROUTES.petDetail(pet.id)} className="shrink-0 w-[180px] snap-start rounded-2xl bg-white shadow-card overflow-hidden active:scale-[0.97] transition-transform">
                  <div className="relative h-32">
                    <img
                      src={pet.photo ?? FALLBACK_PET}
                      alt={pet.name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_PET; }}
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-2 right-2 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full font-display bg-white/95 ${pet.status === "lost" ? "text-[#EF4444]" : "text-[#22C55E]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pet.status === "lost" ? "bg-[#EF4444]" : "bg-[#22C55E]"}`} />
                      {pet.status === "lost" ? "Lost" : "Safe"}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-black text-[16px] text-[#1A2332] font-display truncate">{pet.name}</p>
                    <p className="text-[12px] text-[#6B7A8D] font-body mt-0.5 truncate">{pet.breed || "—"}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Search size={12} className="text-[#4A8FE8]" />
                      <span className="text-[12px] text-[#4A8FE8] font-semibold font-display">{pet.scansToday} {t("dash.scansTodaySuffix")}</span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Add Pet card cuối hàng */}
              <Link href={ROUTES.petCreate} className="shrink-0 w-[180px] snap-start rounded-2xl border-2 border-dashed border-[#4A8FE8]/30 bg-[#EEF5FF]/40 flex flex-col items-center justify-center gap-2 min-h-[180px] active:scale-[0.97] transition-transform">
                <span className="w-12 h-12 rounded-full bg-[#EEF5FF] flex items-center justify-center text-[24px]">＋</span>
                <p className="text-[14px] font-bold text-[#4A8FE8] font-display">{t("dash.addPet").replace("+ ", "")}</p>
              </Link>
            </div>
          )}
        </section>

        {/* ── Quick Actions ── */}
        <section>
          <h2 className="text-[20px] font-black text-[#1A2332] font-display mb-3">{t("dash.quickActions")} ⚡</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ href, icon: Icon, title, sub, iconCls, bgCls }) => (
              <Link key={title} href={href} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-card transition-all active:scale-[0.98]">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${bgCls}`}>
                  <Icon size={20} className={iconCls} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-[#1A2332] font-display leading-tight">{title}</p>
                  <p className="text-[11px] text-[#9BAABB] font-body truncate">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent Scans ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[20px] font-black text-[#1A2332] font-display">{t("dash.recentScans")} 📍</h2>
            <Link href={ROUTES.scanHistory} className="text-[14px] text-[#4A8FE8] font-bold font-display">{t("dash.seeAll")}</Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-card">
              <div className="w-10 h-10 rounded-full bg-[#EEF5FF] flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-[#4A8FE8]" />
              </div>
              <p className="text-[13px] text-[#6B7A8D] font-body">{t("dash.noScans")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map((s, i) => (
                <Link key={i} href={ROUTES.scanHistory} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-card transition-all active:scale-[0.98]">
                  <div className="w-11 h-11 rounded-full bg-[#EEF5FF] flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-[#4A8FE8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-extrabold text-[#1A2332] font-display">{s.petName} {t("dash.wasScanned")}</p>
                    <p className="text-[13px] text-[#6B7A8D] font-body truncate flex items-center gap-1">
                      📍 {s.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="flex items-center gap-1 text-[11px] text-[#9BAABB] font-body">
                      <Clock size={11} /> {localizeRelativeTime(s.time, t)}
                    </span>
                    <ChevronRight size={16} className="text-[#C5CFD9]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Premium banner ── */}
        <Link href="/passport" className="rounded-2xl gradient-premium px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-all">
          <span className="text-[34px] shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-[16px] font-display">{t("dash.upgradeTitle")}</p>
            <p className="text-white/85 text-[12px] font-body leading-snug">{t("dash.upgradeDesc")}</p>
          </div>
          <span className="bg-white text-[#FF7B35] text-[13px] font-extrabold px-4 py-2 rounded-xl font-display shrink-0">{t("dash.tryFree")}</span>
        </Link>

        <div className="h-2" />
      </div>
    </div>
  );
}
