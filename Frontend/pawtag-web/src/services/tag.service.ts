import api from "@/lib/axios";
import type { Pet } from "@/types";

export interface PublicScan {
  status: "ACTIVE" | "UNASSIGNED" | "NOT_FOUND";
  pet: PublicPet | null;
}

export interface PublicPet {
  name: string;
  species: string;
  breed: string;
  ageMonths: number | null;
  gender: string;
  weight: string;
  color: string;
  photo: string;
  status: "safe" | "lost";
  emergencyMessage: string;
  phone: string | null;
  ownerName: string | null;
  vaccinated: boolean;
  collar: string | null;
  identificationNotes: string | null;
  medical: {
    allergies: string;
    conditions: string;
    medications: string;
    bloodType: string;
    microchipId: string;
    lastVetVisit: string | null;
    vetName: string | null;
  };
  lostMessage: string | null;
  rewardAmount: number | null;
  tagCode: string;
}

export interface TagInfo {
  id: string;
  publicCode: string;
  label: string | null;
  status: string;
  type: string;
  nfcLinked: boolean;
  petId: string | null;
}

export const tagService = {
  getMine: async (): Promise<TagInfo[]> => (await api.get("/tags/mine")).data.data,

  getPublic: async (code: string): Promise<PublicScan> =>
    (await api.get(`/public/t/${code}`)).data.data,

  activate: async (publicCode: string, petId: string) =>
    (await api.post("/tags/activate", { publicCode, petId })).data.data,

  toggleNfc: async (tagId: string, enabled: boolean): Promise<TagInfo> =>
    (await api.post(`/tags/${tagId}/nfc`, { enabled })).data.data,
};

export type { Pet };
