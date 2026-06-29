import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    { id: "1", title: "SLA Breach Detected", body: "3 vulnerabilities exceeded SLA in Nexus IQ", type: "error", read: false, createdAt: new Date().toISOString(), link: "/security" },
    { id: "2", title: "Waiver Expiring", body: "Waiver W-2024-089 expires in 3 days", type: "warning", read: false, createdAt: new Date().toISOString(), link: "/security" },
    { id: "3", title: "VEG Decision Required", body: "Deal ACME-2025-042 ready for committee review", type: "info", read: false, createdAt: new Date().toISOString(), link: "/veg/workflow" },
  ],
  get unreadCount() { return get().notifications.filter((n) => !n.read).length; },
  addNotification: (n) => set({ notifications: [n, ...get().notifications].slice(0, 50) }),
  markRead: (id) => set({ notifications: get().notifications.map((n) => n.id === id ? { ...n, read: true } : n) }),
  markAllRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
  clearNotifications: () => set({ notifications: [] }),
}));
