import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsDialog from "./NotificationsDialog";

function NotificationBell() {
  const isMobile = useIsMobile();
  const { user } = useAuthSession();
  const { notifications } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);

  if (!user || isMobile) return null;

  const unreadCount = (notifications ?? []).filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative rounded-full"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-medium text-[10px] text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      <NotificationsDialog
        open={open}
        onOpenChange={setOpen}
        userId={user.id}
      />
    </>
  );
}

export default NotificationBell;
