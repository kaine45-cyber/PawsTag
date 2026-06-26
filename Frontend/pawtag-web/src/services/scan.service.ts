import api from "@/lib/axios";
import type { ScanLog } from "@/types";

export const scanService = {
  getHistory: async (petId?: string): Promise<ScanLog[]> =>
    (await api.get(petId ? `/scans/history?petId=${petId}` : "/scans/history")).data.data,

  recordScan: async (publicCode: string, lat?: number, lng?: number, found?: boolean) =>
    (await api.post("/scans", { publicCode, lat, lng, found })).data.data,
};
