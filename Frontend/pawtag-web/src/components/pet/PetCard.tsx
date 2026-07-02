import Link from "next/link";
import type { Pet } from "@/types/pet";
import { ROUTES } from "@/constants/routes";
export function PetCard({ pet, avatarUrl }: { pet: Pet; avatarUrl: string }) {
  return (
    <Link href={ROUTES.petDetail(pet.id)} className="block shrink-0 w-40 rounded-2xl bg-white shadow-card overflow-hidden active:scale-[0.97] transition-transform">
      <div className="relative h-32">
        <img src={avatarUrl} alt={pet.name} className="w-full h-full object-cover" />
        <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-body ${pet.status === "lost" ? "bg-[#EF4444]" : "bg-[#22C55E]"}`}>
          {pet.status === "lost" ? "LOST" : "Safe"}
        </span>
      </div>
      <div className="p-3">
        <p className="font-extrabold text-[14px] text-[#1A2332] font-display">{pet.name}</p>
        <p className="text-[11px] text-[#6B7A8D] font-body">{pet.breed}</p>
      </div>
    </Link>
  );
}
