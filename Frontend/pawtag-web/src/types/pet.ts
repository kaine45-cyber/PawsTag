export type PetSpecies = "dog" | "cat" | "rabbit" | "bird" | "other";
export type PetGender  = "male" | "female";
export type PetStatus  = "safe" | "lost";
export interface PetMedical { allergies: string; conditions: string; medications: string; bloodType: string; microchipId: string; lastVetVisit: string; vetName: string; vetPhone: string; }
export interface EmergencyContact { id: string; name: string; phone: string; relationship: string; priority: number; }
export interface Pet { id: string; ownerId: string; name: string; species: PetSpecies; breed: string; gender: PetGender; birthDate: string; ageMonths: number | null; weight: string; color: string; collar?: string; identificationNotes?: string; photo: string; status: PetStatus; tagCode: string; phone: string; emergencyMessage: string; scansToday: number; totalScans: number; medical: PetMedical; lostMessage?: string | null; rewardAmount?: number | null; alertRadiusKm?: number | null; emergencyContacts?: EmergencyContact[]; }
