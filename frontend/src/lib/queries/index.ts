import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => api.getDashboardSummary(),
    refetchInterval: 10000,
  });
}

export function useEvents(params: Parameters<typeof api.getEvents>[0]) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => api.getEvents(params),
    refetchInterval: 5000,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => api.getEventById(id),
    enabled: Boolean(id),
  });
}

export function useAlerts(params: Parameters<typeof api.getAlerts>[0]) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => api.getAlerts(params),
    refetchInterval: 8000,
  });
}

export function useRules() {
  return useQuery({
    queryKey: ["rules"],
    queryFn: () => api.getRules(),
  });
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: () => api.getSources(),
    refetchInterval: 10000,
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      alertId,
      status,
      notes,
    }: {
      alertId: string;
      status: string;
      notes?: string;
    }) => api.updateAlertStatus(alertId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId,
      updates,
    }: {
      ruleId: string;
      updates: { enabled?: boolean; contribution?: number; threshold?: Record<string, any> };
    }) => api.updateRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useToggleSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, enabled }: { sourceId: string; enabled: boolean }) =>
      api.toggleSource(sourceId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });
}
