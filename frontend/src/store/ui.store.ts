import { create } from "zustand";

type ViewType =
  | "dashboard"
  | "veg"
  | "security"
  | "nexus"
  | "roadmaps"
  | "saas"
  | "audits"
  | "committees"
  | "admin";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface UIState {
  sidebarOpen: boolean;
  currentView: ViewType;
  theme: "light" | "dark";
  toasts: Toast[];
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: ViewType) => void;
  setTheme: (theme: "light" | "dark") => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentView: "dashboard",
  theme: "light",
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  setTheme: (theme) => set({ theme }),
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
