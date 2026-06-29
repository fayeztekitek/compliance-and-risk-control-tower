import { create } from "zustand";
import type { VegDashboardFilters } from "../api/veg.api";

const DEFAULTS: VegDashboardFilters = {};

interface VegDashboardFilterState {
  filters: VegDashboardFilters;
  setFilter: <K extends keyof VegDashboardFilters>(key: K, value: VegDashboardFilters[K]) => void;
  setMultipleFilters: (partial: Partial<VegDashboardFilters>) => void;
  resetFilters: () => void;
}

export const useVegDashboardFilterStore = create<VegDashboardFilterState>()((set) => ({
  filters: DEFAULTS,
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  setMultipleFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULTS }),
}));
