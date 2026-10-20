import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markReadMutation = useMutation<void, Error, string>({
    mutationFn: (notificationId) =>
      notificationService.markAsRead(notificationId),
    onSettled: invalidateNotifications,
  });

  const markAllReadMutation = useMutation<void, Error, void>({
    mutationFn: () => notificationService.markAllAsRead(),
    onSettled: invalidateNotifications,
  });

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: (notificationId) =>
      notificationService.removeNotification(notificationId),
    onSettled: invalidateNotifications,
  });

  const clearAllMutation = useMutation<void, Error, void>({
    mutationFn: () => notificationService.clearAllNotifications(),
    onSettled: invalidateNotifications,
  });

  return {
    markRead: markReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
    isErrorMarkRead: markReadMutation.isError,
    markReadError: markReadMutation.error,
    markAllRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
    removeNotification: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
    isErrorRemove: removeMutation.isError,
    removeError: removeMutation.error,
    clearAll: clearAllMutation.mutate,
    isClearing: clearAllMutation.isPending,
    isErrorClear: clearAllMutation.isError,
    clearError: clearAllMutation.error,
  };
}
