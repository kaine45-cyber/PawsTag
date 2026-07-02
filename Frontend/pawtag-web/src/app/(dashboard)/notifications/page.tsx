"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCheck, MapPin, Trash2, Bell, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { notificationService } from "@/services/notification.service";
import { useI18n } from "@/i18n/LanguageContext";
import { localizeNotifTitle, localizeNotifBody, localizeRelativeTime } from "@/i18n/localizeNotification";
import type { Notification } from "@/types";

/** Icon emoji khi không có ảnh pet — suy từ tiêu đề / loại. */
function iconFor(n: Notification): { emoji: string; bg: string } {
  const t = n.title.toLowerCase();
  if (t.includes("tip")) return { emoji: "💡", bg: "bg-[#F3F0FF]" };
  if (t.includes("deliver")) return { emoji: "📦", bg: "bg-[#EDF7F2]" };
  if (t.includes("summary")) return { emoji: "🔔", bg: "bg-[#FFF7E8]" };
  if (n.type === "location") return { emoji: "📍", bg: "bg-[#EDF7F2]" };
  if (n.type === "medical") return { emoji: "💉", bg: "bg-[#FFF7F0]" };
  if (n.type === "alert") return { emoji: "⚠️", bg: "bg-[#FEF2F2]" };
  return { emoji: "🐾", bg: "bg-[#EEF5FF]" };
}

const hasLocation = (n: Notification) => n.type === "scan" || n.type === "location";

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    let on = true;
    notificationService.getAll()
      .then((d) => { if (on) setItems(d); })
      .catch(() => { if (on) setItems([]); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const unreadCount = items.filter((n) => n.unread).length;
  const shown = filter === "unread" ? items.filter((n) => n.unread) : items;

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    try { await notificationService.markAllRead(); } catch { /* ignore */ }
  }
  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try { await notificationService.markRead(id); } catch { /* ignore */ }
  }
  async function clearAll() {
    setItems([]);
    try { await notificationService.clearAll(); } catch { /* ignore */ }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-full"><Loader2 size={28} className="text-[#4A8FE8] animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F7F9FC]">

      {/* Header */}
      <header className="bg-white px-5 pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Back" onClick={() => router.back()} className="w-11 h-11 rounded-full bg-[#EEF2FB] flex items-center justify-center active:scale-90">
              <ArrowLeft size={18} className="text-[#1A2332]" />
            </button>
            <div>
              <h1 className="text-[24px] font-black text-[#1A2332] font-display leading-none">{t("notifs.title")}</h1>
              <p className="text-[14px] text-[#FF7B35] font-bold font-display mt-1">{unreadCount} {t("notifs.unread")}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-[15px] text-[#4A8FE8] font-bold font-display pt-2">
              <CheckCheck size={18} /> {t("notifs.markAllRead")}
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={() => setFilter("all")} className={`px-5 py-2 rounded-full text-[14px] font-bold font-display ${filter === "all" ? "gradient-brand text-white shadow-cta" : "bg-[#EEF2FB] text-[#6B7A8D]"}`}>{t("notifs.all")}</button>
          <button type="button" onClick={() => setFilter("unread")} className={`px-5 py-2 rounded-full text-[14px] font-bold font-display ${filter === "unread" ? "gradient-brand text-white shadow-cta" : "bg-[#EEF2FB] text-[#4A8FE8]"}`}>{t("notifs.unreadFilter")} ({unreadCount})</button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-[#EEF2F7] flex items-center justify-center"><Bell size={28} className="text-[#9BAABB]" /></div>
            <p className="text-[14px] font-bold text-[#6B7A8D] font-display">{filter === "unread" ? t("notifs.noneUnread") : t("notifs.noneYet")}</p>
          </div>
        ) : (
          shown.map((n) => {
            const ic = iconFor(n);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-3 rounded-2xl px-4 py-4 text-left w-full transition-all active:scale-[0.99] ${
                  n.unread ? "bg-[#EAF0FB] border border-[#4A8FE8]/15" : "bg-white shadow-card"
                }`}
              >
                {/* Icon */}
                <div className="relative shrink-0">
                  {n.petAvatar ? (
                    <img src={n.petAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] ${ic.bg}`}>{ic.emoji}</div>
                  )}
                  {n.unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4A8FE8] border-2 border-white" />}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-extrabold text-[#1A2332] font-display leading-snug">{localizeNotifTitle(n.title, t)}</p>
                  <p className="text-[14px] text-[#6B7A8D] font-body leading-relaxed mt-0.5">{localizeNotifBody(n.body, t)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[13px] text-[#9BAABB] font-body">{localizeRelativeTime(n.time, t)}</span>
                    {hasLocation(n) && (
                      <span className="flex items-center gap-1 text-[13px] font-bold font-display text-[#4A8FE8]">
                        <MapPin size={13} /> {t("notifs.locationRecorded")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}

        {/* Clear all */}
        {items.length > 0 && (
          <button type="button" onClick={clearAll} className="mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#C5CFD9]/60 text-[#9BAABB] font-bold font-display active:scale-95">
            <Trash2 size={17} /> {t("notifs.clearAll")}
          </button>
        )}
      </div>
    </div>
  );
}
