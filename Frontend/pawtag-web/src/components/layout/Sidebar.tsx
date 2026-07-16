"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PawPrint, History,
  Bell, BookOpen, Loader2, LogOut, UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV_GROUPS = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"    },
      { href: "/pet",          icon: PawPrint,        label: "My Pets"      },
      { href: "/scan/history", icon: History,         label: "Scan History" },
    ],
  },
  {
    label: "ACTIVITY",
    items: [
      { href: "/notifications", icon: Bell,     label: "Notifications" },
      { href: "/passport",      icon: BookOpen, label: "Pet Passport"  },
    ],
  },
  {
    label: "MORE",
    items: [
      { href: "/profile", icon: UserCircle, label: "Profile" },
    ],
  },
];

export default function Sidebar() {
  const path    = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
    } catch {
      setLogoutError("Could not sign out. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className="hidden md:flex flex-col w-[228px] shrink-0 rounded-3xl p-4 gap-1"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        maxHeight: 820,
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-cta shrink-0">
          <PawPrint size={20} color="#fff" />
        </div>
        <span className="text-[17px] font-black text-[#1A2332] font-display">PawsTag</span>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label} className="mb-3">
            <p className="text-[9px] font-bold tracking-widest text-[#C5CFD9] uppercase px-3 mb-1 font-body">
              {label}
            </p>
            {items.map(({ href, icon: Icon, label: itemLabel }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-0.5 transition-all active:scale-[0.98] ${
                    active
                      ? "bg-[rgba(74,143,232,0.14)] border border-[rgba(74,143,232,0.2)]"
                      : "hover:bg-[#EEF2F7]"
                  }`}
                >
                  <Icon
                    size={16}
                    className={active ? "text-[#4A8FE8]" : "text-[#6B7A8D]"}
                  />
                  <span
                    className={`text-[13px] flex-1 font-display ${
                      active ? "font-extrabold text-[#4A8FE8]" : "font-semibold text-[#6B7A8D]"
                    }`}
                  >
                    {itemLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: user + logout */}
      <div className="pt-3 border-t border-[rgba(74,143,232,0.1)]">
        <div className="flex items-center gap-3 px-2 mb-2">
          <img
            src={user?.avatar ?? "https://images.unsplash.com/photo-1640384974326-347e7e3a9e4f?w=80&q=80"}
            alt="User"
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-[#1A2332] font-display truncate">
              {user?.name ?? "Guest"}
            </p>
            <p className="text-[10px] text-[#9BAABB] font-body truncate">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-[#EF4444] hover:bg-[#FEF2F2] transition-all active:scale-95 font-body disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
        {logoutError && <p className="px-2 mt-1 text-[10px] text-[#EF4444] font-body">{logoutError}</p>}
        {/* Design spec footer note */}
        <p className="text-[9px] text-center text-[#C5CFD9] font-body mt-2 tracking-wider">
          390×844 · iPhone 15
        </p>
      </div>
    </aside>
  );
}
