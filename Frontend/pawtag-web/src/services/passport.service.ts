import api from "@/lib/axios";

export interface PassportData {
  petId: string;
  name: string;
  breed: string;
  photo: string | null;
  passportNo: string;
  issued: string;
  pawstagId: string;
  mrz: string;
  identity: {
    fullName: string; species: string; breed: string;
    dateOfBirth: string; ageMonths: number | null; weight: string;
    primaryColor: string | null; eyeColor: string | null;
  };
  microchip: {
    microchipId: string | null; implantDate: string | null;
    implantLocation: string | null; pawstagId: string;
  };
  owner: { name: string; phone: string | null; city: string | null; avatar: string | null };
  health: { vaccinesValid: number; vaccinesTotal: number; vetVisitsThisYear: number; healthScore: number };
  vaccinations: { id: string; name: string; given: string; due: string; status: string }[];
  vetVisits: { id: string; vetName: string; clinic: string; note: string; date: string }[];
  medical: {
    bloodType: string | null; idealWeight: string; allergies: string | null;
    medications: string | null; neutered: boolean; neuteredDate: string | null; diet: string | null;
  };
  // Trung tính ngôn ngữ: code/detailCode được dịch ở client (xem passport/page.tsx).
  travel: { code: string; status: string; detailCode: string; detailValue: string | null }[];
}

export interface VaccinationInput { name: string; givenDate?: string; dueDate?: string }
export interface VetVisitInput { vetName?: string; clinic?: string; note?: string; visitDate?: string }

export const passportService = {
  get: async (petId: string): Promise<PassportData> =>
    (await api.get(`/pets/${petId}/passport`)).data.data,

  addVaccination: async (petId: string, body: VaccinationInput): Promise<PassportData> =>
    (await api.post(`/pets/${petId}/vaccinations`, body)).data.data,

  deleteVaccination: async (petId: string, vaccId: string): Promise<PassportData> =>
    (await api.delete(`/pets/${petId}/vaccinations/${vaccId}`)).data.data,

  addVetVisit: async (petId: string, body: VetVisitInput): Promise<PassportData> =>
    (await api.post(`/pets/${petId}/vet-visits`, body)).data.data,

  deleteVetVisit: async (petId: string, visitId: string): Promise<PassportData> =>
    (await api.delete(`/pets/${petId}/vet-visits/${visitId}`)).data.data,
};
