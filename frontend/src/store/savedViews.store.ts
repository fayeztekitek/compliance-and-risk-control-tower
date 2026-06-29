import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedView {
  id: string;
  name: string;
  page: string;
  state: Record<string, unknown>;
  createdAt: number;
}

interface SavedViewsState {
  views: SavedView[];
  saveView: (name: string, page: string, state: Record<string, unknown>) => void;
  deleteView: (id: string) => void;
  getViewsForPage: (page: string) => SavedView[];
}

export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set, get) => ({
      views: [],
      saveView: (name, page, state) => {
        const view: SavedView = {
          id: `${page}-${Date.now()}`,
          name,
          page,
          state,
          createdAt: Date.now(),
        };
        set({ views: [...get().views, view] });
      },
      deleteView: (id) => set({ views: get().views.filter((v) => v.id !== id) }),
      getViewsForPage: (page) => get().views.filter((v) => v.page === page),
    }),
    { name: "saved-views-storage" }
  )
);
