import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNotificationTime } from "./notificationTime";
import type { AppNotification } from "@/type/notification";

export interface NotificationsListProps {
  readonly notifications: AppNotification[];
  readonly onOpen: (notification: AppNotification) => void;
  readonly onMarkRead: (notificationId: string) => void;
  readonly onRemove: (notificationId: string) => void;
}

function NotificationsList({
  notifications,
  onOpen,
  onMarkRead,
  onRemove,
}: Readonly<NotificationsListProps>) {
  if (notifications.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No notifications yet.
      </p>
    );
  }

  return (
    <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(notification)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen(notification);
              }
            }}
            className="flex w-full cursor-pointer items-start gap-2 rounded-lg border border-muted-foreground/20 p-3 text-left transition-colors hover:bg-muted/50"
          >
            <span
              className={`mt-1.5 size-2 shrink-0 rounded-full ${
                notification.is_read ? "bg-transparent" : "bg-destructive"
              }`}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={
                  notification.is_read
                    ? "font-normal"
                    : "font-semibold text-foreground"
                }
              >
                {notification.title}
              </span>
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {notification.message}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatNotificationTime(notification.created_at)}
              </span>
            </span>
            <span className="flex shrink-0 flex-col gap-1">
              {!notification.is_read && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Mark as read"
                  aria-label="Mark as read"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                >
                  <Check />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Remove notification"
                aria-label="Remove notification"
                className="text-muted-foreground hover:text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(notification.id);
                }}
              >
                <Trash2 />
              </Button>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default NotificationsList;
