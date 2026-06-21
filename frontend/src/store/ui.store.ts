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

interface UIState {
  sidebarOpen: boolean;
  currentView: ViewType;
  theme: "light" | "dark";
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: ViewType) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentView: "dashboard",
  theme: "light",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  setTheme: (theme) => set({ theme }),
}));
