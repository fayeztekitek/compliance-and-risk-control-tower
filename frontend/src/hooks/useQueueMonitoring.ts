import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface QueueStatus {
  queue: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export function useQueueStatuses() {
  return useQuery<QueueStatus[]>({
    queryKey: ["queue-statuses"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/queues");
      return res.data.data;
    },
    refetchInterval: 10000,
  });
}

export function useRetryQueue(queueName: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/api/admin/queues/${queueName}/retry-all`);
      return res.data.data;
    },
  });
}

export function useCleanQueue(queueName: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/api/admin/queues/${queueName}/clean`);
      return res.data.data;
    },
  });
}
