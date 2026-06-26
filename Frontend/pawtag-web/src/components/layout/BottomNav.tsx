"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, Scan, Clock, Bell } from "lucide-react";

const tabs = [
  { href: "/dashboard",     icon: Home,  label: "Home"    },
  { href: "/pet",           icon: Tag,   label: "Tags"    },
  { href: "/scan/history",  icon: Clock, label: "History" },
  { href: "/notifications", icon: Bell,  label: "Alerts"  },
];

export default function BottomNav() {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  const left = tabs.slice(0, 2);   // Home, Tags
  const right = tabs.slice(2);     // History, Alerts

  return (
    <nav className="relative grid grid-cols-5 w-full h-[64px] bg-white/95 backdrop-blur-[20px] border-t border-[rgba(74,143,232,0.1)]">
      {left.map((t) => <TabItem key={t.href} {...t} active={isActive(t.href)} />)}

      {/* Ô giữa: chừa chỗ cho nút Scan nổi */}
      <div aria-hidden />

      {right.map((t) => <TabItem key={t.href} {...t} active={isActive(t.href)} />)}

      {/* Nút Scan nổi ở giữa */}
      <Link
        href="/scan"
        aria-label="Scan"
        className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center gap-0.5"
      >
        <span
          className={`w-14 h-14 rounded-full gradient-brand flex items-center justify-center shadow-cta transition-transform active:scale-90 ${
            isActive("/scan") ? "ring-4 ring-[rgba(74,143,232,0.25)]" : ""
          }`}
        >
          <Scan size={26} color="#fff" />
        </span>
        <span className="text-[10px] font-bold text-[#4A8FE8] font-display">Scan</span>
      </Link>
    </nav>
  );
}

function TabItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center transition-all active:scale-90">
      <span className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-2xl ${active ? "bg-[#EEF5FF]" : ""}`}>
        <Icon size={20} className={active ? "text-[#4A8FE8]" : "text-[#9BAABB]"} />
        <span className={`text-[10px] font-display ${active ? "font-bold text-[#4A8FE8]" : "font-medium text-[#9BAABB]"}`}>
          {label}
        </span>
      </span>
    </Link>
  );
}
