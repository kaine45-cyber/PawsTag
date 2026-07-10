"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { scanService } from "@/services/scan.service";
import { useI18n } from "@/i18n/LanguageContext";
import { localizeRelativeTime } from "@/i18n/localizeNotification";
import type { ScanLog } from "@/types";

export default function HistoryPage() {
  const { t } = useI18n();
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("All");

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const data = await scanService.getHistory();
        if (on) setScans(data);
      } catch {
        if (on) setScans([]);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const chips = useMemo(() => {
    const names = Array.from(new Set(scans.map((s) => s.petName)));
    return ["All", ...names];
  }, [scans]);

  const filtered = active === "All" ? scans : scans.filter((s) => s.petName === active);

  // Chỉ đếm địa điểm có tên thật (quét không GPS → "Unknown location" thì bỏ qua)
  const uniqueLocs = new Set(scans.filter((s) => s.location !== "Unknown location").map((s) => s.location.split(",")[0])).size;
  const petCount = new Set(scans.map((s) => s.petName)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 size={28} className="text-[#4A8FE8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-6 pb-8 gap-5">

      <h1 className="text-[22px] font-black text-[#1A2332] font-display">{t("history.title")}</h1>

      {/* Filter chips */}
      {chips.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold font-display transition-all active:scale-95 ${
                active === c
                  ? "gradient-brand text-white shadow-cta"
                  : "bg-white text-[#6B7A8D] shadow-card border border-[rgba(74,143,232,0.1)]"
              }`}
            >
              {c === "All" ? t("notifs.all") : c}
            </button>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("history.totalScans"), val: String(scans.length) },
          { label: t("history.locations"),  val: String(uniqueLocs) },
          { label: t("history.pets"),       val: String(petCount) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-card text-center">
            <p className="text-[20px] font-black text-[#4A8FE8] font-display">{val}</p>
            <p className="text-[10px] text-[#6B7A8D] font-body mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Scan list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full bg-[#EEF2F7] flex items-center justify-center">
            <Clock size={28} className="text-[#9BAABB]" />
          </div>
          <p className="text-[14px] font-bold text-[#6B7A8D] font-display">{t("history.noScans")}</p>
          <p className="text-[12px] text-[#9BAABB] font-body">{t("history.noScansDesc")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s, i) => (
            <div key={s.id} className="bg-white rounded-2xl px-4 py-3 shadow-card flex items-center gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#4A8FE8]" />
                {i < filtered.length - 1 && <div className="w-px h-8 bg-[#EEF2F7] mt-1" />}
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#EEF5FF] flex items-center justify-center">
                {s.petAvatar
                  ? <img src={s.petAvatar} alt={s.petName} className="w-full h-full object-cover" />
                  : <MapPin size={16} className="text-[#4A8FE8]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#1A2332] font-display">{s.petName} {t("common.wasScanned")}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-[#4A8FE8] shrink-0" />
                  <p className="text-[11px] text-[#6B7A8D] font-body truncate">{s.location}</p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <Clock size={10} className="text-[#9BAABB] mb-0.5" />
                <p className="text-[10px] text-[#9BAABB] font-body text-right leading-tight">{localizeRelativeTime(s.timeAgo, t)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
