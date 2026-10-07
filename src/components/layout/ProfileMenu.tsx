import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogInIcon, LogOut, User, UserRoundArrowLeft } from "lucide-react";

function ProfileMenu() {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="icon" className="rounded-full">
          <User className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSeparator className="hidden" />
        <DropdownMenuItem onClick={() => navigate("/login")}>
          <LogInIcon />
          Login
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/register")}>
          <UserRoundArrowLeft />
          Register
        </DropdownMenuItem>
        {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
        <DropdownMenuSeparator className="hidden" />
        <DropdownMenuItem className="hidden hover:text-destructive">
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileMenu;
