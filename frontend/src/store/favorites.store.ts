import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteItem {
  id: string;
  label: string;
  path: string;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  recentPages: { path: string; label: string; visitedAt: number }[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (path: string) => boolean;
  addRecent: (path: string, label: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentPages: [],
      toggleFavorite: (item) => {
        const exists = get().favorites.find((f) => f.path === item.path);
        if (exists) {
          set({ favorites: get().favorites.filter((f) => f.path !== item.path) });
        } else {
          set({ favorites: [...get().favorites, item] });
        }
      },
      isFavorite: (path) => get().favorites.some((f) => f.path === path),
      addRecent: (path, label) => {
        const filtered = get().recentPages.filter((r) => r.path !== path);
        set({ recentPages: [{ path, label, visitedAt: Date.now() }, ...filtered].slice(0, 5) });
      },
    }),
    { name: "favorites-storage" }
  )
);
