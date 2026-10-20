import { Link } from "react-router";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

function Login() {
  return (
    <article className="flex min-h-[calc(100svh-4.3rem)] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          J's Library
        </Link>
        <LoginForm />
      </div>
    </article>
  );
}

export default Login;
