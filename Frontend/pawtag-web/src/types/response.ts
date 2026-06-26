export interface ApiResponse<T = unknown> { success: boolean; data: T; message?: string; }
export type NotificationType = "scan" | "location" | "medical" | "alert" | "system";
export interface Notification { id: string; type: NotificationType; title: string; body: string; time: string; unread: boolean; petId?: string; petAvatar?: string; }
