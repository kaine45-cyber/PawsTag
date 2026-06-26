// Future: replace with real API calls via petService
import { useAuth } from "@/hooks/useAuth";
export function usePet(petId?: string) {
  const { pets } = useAuth();
  const pet = petId ? pets.find((p) => p.id === petId) ?? null : null;
  return { pet, pets };
}
