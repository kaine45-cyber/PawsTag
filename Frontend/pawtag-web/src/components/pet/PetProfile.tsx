import type { Pet } from "@/types/pet";
// Full pet profile card — implementation coming soon
export function PetProfile({ pet }: { pet: Pet }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <p className="font-extrabold text-[16px] text-[#1A2332] font-display">{pet.name}</p>
      <p className="text-[12px] text-[#6B7A8D] font-body">{pet.breed}</p>
    </div>
  );
}
