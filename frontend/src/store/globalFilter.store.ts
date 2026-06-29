import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GlobalFilters {
  dateRange: [string, string] | null;
  organizationIds: string[];
  query: string;
}

interface GlobalFilterState {
  filters: GlobalFilters;
  active: boolean;
  setFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  resetFilters: () => void;
  toggleActive: () => void;
}

const DEFAULT: GlobalFilters = { dateRange: null, organizationIds: [], query: "" };

export const useGlobalFilterStore = create<GlobalFilterState>()(
  persist(
    (set, get) => ({
      filters: { ...DEFAULT },
      active: false,
      setFilter: (key, value) => set({ filters: { ...get().filters, [key]: value } }),
      resetFilters: () => set({ filters: { ...DEFAULT } }),
      toggleActive: () => set({ active: !get().active }),
    }),
    { name: "global-filters-storage" }
  )
);
