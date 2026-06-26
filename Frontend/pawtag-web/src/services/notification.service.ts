import api from "@/lib/axios";
import type { Notification } from "@/types";

export const notificationService = {
  getAll: async (): Promise<Notification[]> => (await api.get("/notifications")).data.data,

  markRead: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data.data,

  markAllRead: async () => (await api.patch("/notifications/read-all")).data.data,

  clearAll: async () => (await api.delete("/notifications")).data.data,
};
