import { MOCK_SCANS } from "@/lib/mock-data";
export function useScan(petId?: string) {
  const scans = petId ? MOCK_SCANS.filter((s) => s.petId === petId) : MOCK_SCANS;
  return { scans };
}
