import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
}

export interface SystemHealth {
  status: string;
  db: string;
  redis: string;
  uptime: number;
  memory: string;
}

export const adminApi = {
  listUsers() {
    return apiClient.get<{ data: User[] }>("/api/admin/users");
  },
  getUser(id: string) {
    return apiClient.get<{ data: User }>(`/api/admin/users/${id}`);
  },
  createUser(data: Partial<User> & { password: string }) {
    return apiClient.post<{ data: User }>("/api/admin/users", data);
  },
  updateUser(id: string, data: Partial<User>) {
    return apiClient.put<{ data: User }>(`/api/admin/users/${id}`, data);
  },
  deleteUser(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/admin/users/${id}`);
  },
  getActivityLogs() {
    return apiClient.get<{ data: ActivityLog[] }>("/api/admin/activity-logs");
  },
  getSystemHealth() {
    return apiClient.get<{ data: SystemHealth }>("/api/admin/system-health");
  },
};
