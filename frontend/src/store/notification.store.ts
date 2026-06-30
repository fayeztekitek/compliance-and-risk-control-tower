import { create } from "zustand";
import { apiClient } from "../api/client";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (filter?: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearNotifications: () => void;
}

function mapBackendNotification(n: any): AppNotification {
  return {
    id: n.id,
    title: n.subject || n.title || "",
    body: n.body || "",
    type: n.type || "info",
    read: n.status === "READ" || !!n.read_at,
    createdAt: n.created_at || n.createdAt,
    link: n.link,
    entityType: n.entity_type,
    entityId: n.entity_id,
  };
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (filter?: string) => {
    set({ loading: true });
    try {
      const params: Record<string, string> = { limit: "50" };
      if (filter) params.filter = filter;
      const r = await apiClient.get<{ data: any[] }>("/api/notifications", { params });
      const mapped = r.data.data.map(mapBackendNotification);
      set({ notifications: mapped, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const r = await apiClient.get<{ count: number }>("/api/notifications/unread-count");
      set({ unreadCount: r.data.count });
    } catch {
      // ignore
    }
  },

  markRead: async (id: string) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      set({
        notifications: get().notifications.map((n) => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await apiClient.patch("/api/notifications/read-all");
      set({
        notifications: get().notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      });
    } catch {
      // ignore
    }
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
