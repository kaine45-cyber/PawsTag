import type { PetMedical } from "@/types/pet";
// Medical card component — implementation coming soon
export function MedicalCard({ medical }: { medical: PetMedical }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <p className="text-[12px] text-[#6B7A8D] font-body">Blood Type: {medical.bloodType || "Unknown"}</p>
      <p className="text-[12px] text-[#6B7A8D] font-body">Allergies: {medical.allergies || "None"}</p>
    </div>
  );
}
