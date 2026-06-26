"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PhoneFrame from "@/components/layout/PhoneFrame";
import { PawPrint } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  // ── Loading splash (prevents flash of redirect) ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F7F9FC]">
        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-cta">
          <PawPrint size={26} color="#fff" />
        </div>
        <div className="w-8 h-8 rounded-full border-[3px] border-[#4A8FE8] border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Not logged in — render nothing while redirect fires ──
  if (!isLoggedIn) return null;

  // App web mobile full-screen — không còn khung iPhone
  return <PhoneFrame>{children}</PhoneFrame>;
}
