import { describe, it, expect } from "vitest";
import { useUIStore } from "../src/store/ui.store";

describe("UI Store", () => {
  it("should initialize with default values", () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.currentView).toBe("dashboard");
    expect(state.theme).toBe("light");
  });

  it("should toggle sidebar", () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("should change current view", () => {
    useUIStore.getState().setCurrentView("veg");
    expect(useUIStore.getState().currentView).toBe("veg");
    useUIStore.getState().setCurrentView("security");
    expect(useUIStore.getState().currentView).toBe("security");
  });

  it("should change theme", () => {
    useUIStore.getState().setTheme("dark");
    expect(useUIStore.getState().theme).toBe("dark");
    useUIStore.getState().setTheme("light");
    expect(useUIStore.getState().theme).toBe("light");
  });
});
