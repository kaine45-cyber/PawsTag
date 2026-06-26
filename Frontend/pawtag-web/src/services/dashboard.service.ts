import api from "@/lib/axios";
import type { Pet } from "@/types";

export interface DashboardData {
  stats: {
    totalPets: number;
    activeTags: number;
    scansToday: number;
    totalScans: number;
    lostModeActive: number;
  };
  pets: Pet[];
  recentScans: {
    petName: string;
    petAvatar: string | null;
    location: string;
    time: string;
  }[];
}

export const dashboardService = {
  get: async (): Promise<DashboardData> => (await api.get("/dashboard")).data.data,
};
