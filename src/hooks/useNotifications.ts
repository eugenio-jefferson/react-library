import { useQuery } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";
import type { AppNotification } from "../type/notification";

const NOTIFICATIONS_POLL_INTERVAL_MS = 30_000;

export interface UseNotificationsResult {
  notifications: AppNotification[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useNotifications(
  userId: string | null | undefined = null,
): UseNotificationsResult {
  const { data, isLoading, isError, error, refetch } = useQuery<
    AppNotification[],
    Error
  >({
    queryKey: ["notifications", userId],
    queryFn: () => notificationService.getMyNotifications(userId as string),
    enabled: Boolean(userId),
    refetchInterval: userId ? NOTIFICATIONS_POLL_INTERVAL_MS : false,
  });

  return {
    notifications: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
