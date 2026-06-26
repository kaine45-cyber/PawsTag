"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Plus, QrCode, Eye, PawPrint } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const PET_AVATARS: Record<string, string> = {
  "A8K92X": "https://images.unsplash.com/photo-1612940960267-77571294d37f?w=320&q=80",
  "B3M74Y": "https://images.unsplash.com/photo-1602241628512-1a66af5f3b00?w=320&q=80",
};

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=320&q=80";

export default function PetsPage() {
  const { pets } = useAuth();

  return (
    <div className="flex flex-col min-h-full px-5 pt-6 pb-8 gap-5">

      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-black text-[#1A2332] font-display">My Pets</h1>
        <Link
          href={ROUTES.petCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full gradient-brand text-white text-[13px] font-bold font-display shadow-cta transition-all active:scale-95"
        >
          <Plus size={15} />
          Add Pet
        </Link>
      </div>

      {pets.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-20 h-20 rounded-full bg-[#EEF5FF] flex items-center justify-center">
            <PawPrint size={36} className="text-[#4A8FE8]" />
          </div>
          <div className="text-center">
            <p className="text-[17px] font-extrabold text-[#1A2332] font-display">No pets yet</p>
            <p className="text-[13px] text-[#6B7A8D] font-body mt-1">Add your first pet to get started</p>
          </div>
          <Link
            href={ROUTES.petCreate}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl gradient-brand text-white font-bold font-display shadow-cta transition-all active:scale-95"
          >
            <Plus size={16} />
            Add First Pet
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pets.map((pet) => {
            const avatar = PET_AVATARS[pet.tagCode] ?? FALLBACK_AVATAR;
            const statusColor = pet.status === "lost" ? "#EF4444" : "#22C55E";
            const statusBg    = pet.status === "lost" ? "#FEF2F2" : "#EDF7F2";
            const statusLabel = pet.status === "lost" ? "LOST" : "Safe";

            return (
              <div key={pet.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <Link href={ROUTES.petDetail(pet.id)}>
                  <div className="relative h-44">
                    <img src={avatar} alt={pet.name} className="w-full h-full object-cover" />
                    <span
                      className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full font-body"
                      style={{ color: statusColor, background: statusBg }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link href={ROUTES.petDetail(pet.id)}>
                      <h2 className="text-[18px] font-extrabold text-[#1A2332] font-display">{pet.name}</h2>
                      <p className="text-[12px] text-[#6B7A8D] font-body">
                        {pet.breed} · {pet.age} · {pet.gender === "male" ? "Male" : "Female"}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1 bg-[#EEF5FF] rounded-xl px-3 py-1.5">
                      <Eye size={12} className="text-[#4A8FE8]" />
                      <span className="text-[12px] font-bold text-[#4A8FE8] font-display">{pet.totalScans}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={ROUTES.petTags(pet.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-brand text-white text-[13px] font-bold font-display shadow-cta transition-all active:scale-95"
                    >
                      <QrCode size={14} />
                      View Tag
                    </Link>
                    <Link
                      href={ROUTES.tagScan(pet.tagCode)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#4A8FE8] text-[#4A8FE8] text-[13px] font-bold font-display transition-all active:scale-95"
                    >
                      <PawPrint size={14} />
                      Preview
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add another pet */}
          <Link
            href={ROUTES.petCreate}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#4A8FE8]/30 rounded-2xl py-10 bg-[#EEF5FF]/40 transition-all active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-full bg-[#EEF5FF] flex items-center justify-center">
              <Plus size={26} className="text-[#4A8FE8]" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-extrabold text-[#4A8FE8] font-display">Add Another Pet</p>
              <p className="text-[12px] text-[#9BAABB] font-body mt-0.5">Protect all your furry friends</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
