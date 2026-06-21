import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../src/store/auth.store";

describe("Auth Store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it("should initialize as unauthenticated", () => {
    useAuthStore.getState().initialize();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.user).toBeNull();
  });

  it("should restore session from localStorage", () => {
    const mockUser = { id: "1", name: "Test", email: "test@test.com", role: "ADMIN" as const, status: "ACTIVE" };
    localStorage.setItem("auth_token", "test-token");
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    useAuthStore.getState().initialize();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("test-token");
  });

  it("should clear session on corrupted localStorage", () => {
    localStorage.setItem("auth_token", "test-token");
    localStorage.setItem("auth_user", "not-valid-json");

    useAuthStore.getState().initialize();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
  });
});
