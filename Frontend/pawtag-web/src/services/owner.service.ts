import api from "@/lib/axios";
import type { User } from "@/types";

export const ownerService = {
  me: async (): Promise<User> => (await api.get("/owners/me")).data.data,

  update: async (body: { name?: string; phone?: string; city?: string }): Promise<User> =>
    (await api.put("/owners/me", body)).data.data,

  uploadAvatar: async (file: File): Promise<User> => {
    const fd = new FormData();
    fd.append("file", file);
    return (await api.post("/owners/me/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data.data;
  },
};
