import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type User, type SystemHealth } from "../api/admin.api";
import { useUIStore } from "../store/ui.store";

export function useUserList() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => { const r = await adminApi.listUsers(); return r.data.data; },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) => adminApi.createUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); addToast({ type: "success", message: "User created" }); },
    onError: () => addToast({ type: "error", message: "Failed to create user" }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => adminApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); addToast({ type: "success", message: "User updated" }); },
    onError: () => addToast({ type: "error", message: "Failed to update user" }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); addToast({ type: "success", message: "User deleted" }); },
    onError: () => addToast({ type: "error", message: "Failed to delete user" }),
  });
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ["admin", "activity-logs"],
    queryFn: async () => { const r = await adminApi.getActivityLogs(); return r.data.data; },
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: async () => { const r = await adminApi.getSystemHealth(); return r.data.data; },
  });
}
