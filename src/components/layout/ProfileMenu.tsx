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
import { LogInIcon, LogOut, User, UserRoundArrowLeft } from "lucide-react";
import { useUserAccount } from "@/hooks/useUserAccount";
import { supabase } from "@/services/supabaseClient";
import type { Session } from "@supabase/supabase-js";

function ProfileMenu() {
  const navigate = useNavigate();
  const { signOut } = useUserAccount();
  const [session, setSession] = useState<Session | null>(null);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="icon" className="rounded-full">
          <User className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit">
        {session ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Profile</DropdownMenuLabel>
              <DropdownMenuItem disabled>Email:</DropdownMenuItem>
              <DropdownMenuItem disabled className="text-base">
                {session.user.email}
              </DropdownMenuItem>
            </DropdownMenuGroup>
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
  );
}

export default ProfileMenu;
