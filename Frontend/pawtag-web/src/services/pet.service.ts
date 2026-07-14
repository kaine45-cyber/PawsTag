import api from "@/lib/axios";
import type { Pet } from "@/types";

export interface EmergencyContactInput {
  name?: string;
  phone: string;
  relationship?: string;
  priority?: number;
}

export interface PetCreateInput {
  name: string;
  /** Mã QR (public_code) trên thẻ vật lý — BẮT BUỘC khi tạo pet để kích hoạt thẻ đã in sẵn. */
  publicCode?: string;
  species?: string;
  breed?: string;
  color?: string;
  birthDate?: string;
  weight?: number;
  gender?: string;
  contactPhone?: string;
  bloodType?: string;
  microchipId?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  identificationNotes?: string;
  emergencyMessage?: string;
  photoUrl?: string;
  emergencyContacts?: EmergencyContactInput[];
}

export const petService = {
  getAll: async (): Promise<Pet[]> => (await api.get("/pets")).data.data,

  getById: async (id: string): Promise<Pet> => (await api.get(`/pets/${id}`)).data.data,

  create: async (data: PetCreateInput): Promise<Pet> =>
    (await api.post("/pets", data)).data.data,

  update: async (id: string, data: Partial<PetCreateInput>): Promise<Pet> =>
    (await api.put(`/pets/${id}`, data)).data.data,

  remove: async (id: string): Promise<void> => {
    await api.delete(`/pets/${id}`);
  },

  setLostMode: async (
    id: string,
    body: { isLost: boolean; lostMessage?: string; rewardAmount?: number; alertRadiusKm?: number },
  ): Promise<Pet> => (await api.put(`/pets/${id}/lost-mode`, body)).data.data,

  uploadPhoto: async (id: string, file: File): Promise<Pet> => {
    const fd = new FormData();
    fd.append("file", file);
    return (await api.post(`/pets/${id}/photo`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data.data;
  },
};
