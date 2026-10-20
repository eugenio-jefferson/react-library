import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Bell,
  Heart,
  LibraryBig,
  LogInIcon,
  LogOut,
  User,
  UserRoundArrowLeft,
} from "lucide-react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationsDialog from "@/components/notifications/NotificationsDialog";
import { supabase } from "@/services/supabaseClient";
import type { Session } from "@supabase/supabase-js";

function ProfileMenu() {
  const navigate = useNavigate();
  const { signOut } = useUserAccount();
  const isMobile = useIsMobile();
  const [session, setSession] = useState<Session | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications } = useNotifications(
    isMobile ? session?.user?.id : null,
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  const unreadCount = (notifications ?? []).filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-full"
          >
            <User className="h-[1.2rem] w-[1.2rem]" />
            {isMobile && session && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 font-medium text-[9px] text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">Profile</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-fit">
          {session ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Profile</DropdownMenuLabel>
                <DropdownMenuItem disabled className="text-sm">
                  Email:
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-sm">
                  {session.user.email}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {isMobile && (
                <DropdownMenuItem
                  onClick={() => setNotificationsOpen(true)}
                  className="cursor-pointer"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-medium text-[10px] text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => navigate("/wishlists")}
                className="cursor-pointer"
              >
                <Heart className="mr-2 h-4 w-4" />
                My Wish Lists
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/loans")}
                className="cursor-pointer"
              >
                <LibraryBig className="mr-2 h-4 w-4" />
                My Loans
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                onClick={() => navigate("/login")}
                className="cursor-pointer"
              >
                <LogInIcon className="mr-2 h-4 w-4" />
                Login
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/register")}
                className="cursor-pointer"
              >
                <UserRoundArrowLeft className="mr-2 h-4 w-4" />
                Register
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isMobile && session && (
        <NotificationsDialog
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
          userId={session.user.id}
        />
      )}
    </>
  );
}

export default ProfileMenu;
