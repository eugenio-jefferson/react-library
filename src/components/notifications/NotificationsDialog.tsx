import { useNavigate } from "react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationActions } from "@/hooks/useNotificationActions";
import NotificationsList from "./NotificationsList";
import type { AppNotification } from "@/type/notification";

export interface NotificationsDialogProps {
  readonly onOpenChange: (open: boolean) => void;
  readonly userId: string;
  open: boolean;
}

function NotificationsDialog({
  open,
  onOpenChange,
  userId,
}: Readonly<NotificationsDialogProps>) {
  const navigate = useNavigate();
  const { notifications, isLoading, isError, error, refetch } =
    useNotifications(userId);
  const {
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
    isClearing,
    isErrorClear,
    clearError,
    isErrorRemove,
    removeError,
  } = useNotificationActions();

  const allNotifications = notifications ?? [];
  const unreadCount = allNotifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const handleOpenNotification = (notification: AppNotification) => {
    if (!notification.is_read) {
      markRead(notification.id);
    }
    onOpenChange(false);

    if (notification.related_book_work_id) {
      navigate(`/books/${notification.related_book_work_id}`);
      return;
    }
    if (notification.type !== "book_available") {
      navigate("/loans");
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-destructive">
          <p className="text-sm font-medium">
            {error?.message || "An error occurred while loading notifications."}
          </p>
          <Button variant="destructive" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      );
    }

    return (
      <NotificationsList
        notifications={allNotifications}
        onOpen={handleOpenNotification}
        onMarkRead={markRead}
        onRemove={removeNotification}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
          </DialogTitle>
          <DialogDescription>
            Alerts about your loans and wish list books.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            onClick={() => markAllRead()}
          >
            <CheckCheck className="mr-1 size-3.5" />
            Mark all as read
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={allNotifications.length === 0 || isClearing}
            onClick={() => clearAll()}
          >
            <Trash2 className="mr-1 size-3.5" />
            {isClearing ? "Clearing..." : "Clear all"}
          </Button>
        </div>
        {(isErrorClear || isErrorRemove) && (
          <p className="text-sm text-destructive">
            {clearError?.message || removeError?.message}
          </p>
        )}
        {renderBody()}
      </DialogContent>
    </Dialog>
  );
}

export default NotificationsDialog;
